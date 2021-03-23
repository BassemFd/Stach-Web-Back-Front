var express = require('express');
var router = express.Router();
var UserModel = require('../models/users');
var ShopModel = require('../models/shops');
var CommentModel = require('../models/comments');
var AppointmentModel = require('../models/appointments');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/getShops', async function (req, res, next) {
  var shop = await ShopModel.find().populate('appointments').exec()

  res.json( {shop: shop});
});


/* 7 req.body :radio (salon ou dom, require) lieu, date et heure(calendriers), prestations (liste déroulante) et package (validation de l'overlay de description), les pictos, le rating
utiliser pour page accueil, filtres salon (map et liste)
--> reducer des données du filtre entre la liste, la map et le detail coiffeur qui servira à remplir le fetch à la bdd
*/

router.post('/search', async function (req, res, next) {
  console.log('req.body.data', req.body.data);

  
  let latitude = { $exists: true };
  let longitude = { $exists: true };
  let weekday = { $exists: true };
  let MaxMinutes = 1439;
  let MinMinutes = 0;
  let completeDate = null;
  let quoi = { $exists: true };
  let package = { $exists: true };
  let picto = { $exists: true };
  let rating = 0;
  let priceFork = 0;

  // req.body.data.salonOrHome === 'chez toi' ? (type = true) : null;
  req.body.data.rating ? (rating = req.body.data.rating) : null;
  req.body.data.priceFork ? (priceFork = req.body.data.priceFork) : null;
  req.body.data.offer ? (quoi = req.body.data.offer) : null;
  req.body.data.experience ? (package = req.body.data.experience) : null;
  req.body.data.service ? (picto = req.body.data.service) : null;
  req.body.data.position.longitude ? (latitude = req.body.data.position.longitude) : null;
  req.body.data.position.latitude ? (longitude = req.body.data.position.latitude) : null;

  // We need to send the date and hour chosen by the user
  // First converting date to day of the week to check if the shop is opened
  if (req.body.data.completeDate != null) {
    
    weekday = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ][new Date(req.body.data.utcDate).getDay()]
    
  }

  // Then if hour chosen convert it to minutes
  req.body.data.hour
    ? (MaxMinutes =
        +req.body.data.hour.split(':')[0] * 60 +
        +req.body.data.hour.split(':')[1])
    : null;

  req.body.data.hour
    ? (MinMinutes =
        +req.body.data.hour.split(':')[0] * 60 +
        +req.body.data.hour.split(':')[1])
    : null;

  var shopsList = await ShopModel.find({
    offers: {
      $elemMatch: {
        type: quoi,
      },
    },
    packages: {
      $elemMatch: {
        type: package,
      },
    },
   
    rating: { $gte: rating },
    priceFork: { $gte: priceFork },
    shopFeatures: picto,

    schedule: {
      $elemMatch: {
        dayOfTheWeek: weekday,
        openingHours: { $lte: MaxMinutes },
        closingHours: { $gte: MinMinutes },
      },
    },
  })
    .populate('appointments')
    .populate('comments')
    .exec();

  // We obtain all shops that are open on opening dates and hours plus all other chosen parameters, we need to filter first by already taken appointments and then by distance

  //Filter with nested appointments and number of employees
  let filteredAppointmentsShopsList = [];
  for (let i = 0; i < shopsList.length; i++) {
    if (completeDate != null) {
      let numberOfEmployees = null;
      let counterOfAppointments = null;
      numberOfEmployees = shopsList[i].shopEmployees.length;
      for (let j = 0; j < shopsList[i].appointments.length; j++) {

        if (
          completeDate > shopsList[i].appointments[j].startDate &&
          completeDate < shopsList[i].appointments[j].endDate
        ) {
          counterOfAppointments = counterOfAppointments + 1;
        }
      }


      if (counterOfAppointments < numberOfEmployees) {
        filteredAppointmentsShopsList.push(shopsList[i]);
      }
    } else {
      filteredAppointmentsShopsList.push(shopsList[i]);
    }
  }


  // Filter with distance the result of filteredAppointmentsShopsList
  // Distance in miles
  let distanceMax = 4;

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 3963; // Radius of the earth in miles
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in miles
    return d;
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  let filteredDistanceShopsList = [];

  for (let i = 0; i < filteredAppointmentsShopsList.length; i++) {
    if (req.body.data.position.latitude != null && req.body.data.position.longitude != null) {
      let distance = Math.floor(
        getDistanceFromLatLonInKm(
          latitude,
          longitude,
          filteredAppointmentsShopsList[i].latitude,
          filteredAppointmentsShopsList[i].longitude
        )
      );
      // Check how distance is checked

      if (distance < distanceMax) {
        filteredDistanceShopsList.push(filteredAppointmentsShopsList[i]);
      }
    } else {
      filteredDistanceShopsList.push(filteredAppointmentsShopsList[i]);
    }
  }

  res.json(filteredDistanceShopsList);
});

// route pour enregistrer les shops via postman - NE PAS EFFACER LES CHAMPS COMMENTÉS //
router.post('/addShop', async function (req, res, next) {
  var newShop = new ShopModel({
    shopName: req.body.shopName,
    shopImages: [
      req.body.shopImage1,
      req.body.shopImage2,
      req.body.shopImage3,
      req.body.shopImage4,
    ],
    shopAddress: req.body.shopAddress,
    shopPhone: req.body.shopPhone,
    shopMail: req.body.shopMail,
    shopDescription: req.body.shopDescription,
    shopFeatures: [
      req.body.shopFeatures1,
      req.body.shopFeatures2,
      req.body.shopFeatures3,
      // req.body.shopFeatures4,
    ],
    shopEmployees: [
      req.body.shopEmployee1,
      req.body.shopEmployee2,
      // req.body.shopEmployee3
    ],
    offers: [
      {
        type: req.body.offerName1,
        price: req.body.offerPrice1,
        duration: req.body.offerDuration1,
      },
      {
        type: req.body.offerName2,
        price: req.body.offerPrice2,
        duration: req.body.offerDuration2,
      },
      {
        type: req.body.offerName3,
        price: req.body.offerPrice3,
        duration: req.body.offerDuration3,
      },
      {
        type: req.body.offerName4,
        price: req.body.offerPrice4,
        duration: req.body.offerDuration4,
      },
      {
        type: req.body.offerName5,
        price: req.body.offerPrice5,
        duration: req.body.offerDuration5,
      },
      {
        type: req.body.offerName6, 
        price: req.body.offerPrice6, 
        duration: req.body.offerDuration6
      }
    ],
    packages: [
      {
        type: req.body.packageName1,
        price: req.body.packagePrice1,
        duration: req.body.packageDuration1,
        description: req.body.packageDescription1,
      },
      {
        type: req.body.packageName2,
        price: req.body.packagePrice2,
        duration: req.body.packageDuration2,
        description: req.body.packageDescription2,
      },
      // {
      //   type: req.body.packageName3, 
      //   price: req.body.packagePrice3, 
      //   duration: req.body.packageDuration3, 
      //   description: req.body.packageDescription3
      // }
    ],
    schedule: [
      // {
      //   dayOfTheWeek: 'Monday', 
      //   openingHours: req.body.openingHoursMonday, 
      //   closingHours: req.body.closingHoursMonday
      // },
      {
        dayOfTheWeek: 'Tuesday',
        openingHours: req.body.openingHoursTuesday,
        closingHours: req.body.closingHoursTuesday,
      },
      {
        dayOfTheWeek: 'Wednesday',
        openingHours: req.body.openingHoursWednesday,
        closingHours: req.body.closingHoursWednesday,
      },
      {
        dayOfTheWeek: 'Thursday',
        openingHours: req.body.openingHoursThursday,
        closingHours: req.body.closingHoursThursday,
      },
      {
        dayOfTheWeek: 'Friday',
        openingHours: req.body.openingHoursFriday,
        closingHours: req.body.closingHoursFriday,
      },
      {
        dayOfTheWeek: 'Saturday',
        openingHours: req.body.openingHoursSaturday,
        closingHours: req.body.closingHoursSaturday,
      },
    //   {
    //   dayOfTheWeek: 'Sunday', 
    //   openingHours: req.body.openingHoursSunday, 
    //   closingHours: req.body.closingHoursSunday
    // },
    ],
    atHome: req.body.atHome,
    rating: 0,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
  });

  await newShop.save();

  res.json({ result: true });
});

router.put('/addPriceFork', async function (req, res, next) {
  var shop = await ShopModel.findOne({ shopName: req.body.shopName });

  var totalPrice = 0;
  var numberOfOffer = 0;
  for (let i = 0; i < shop.offers.length; i++) {
    totalPrice += shop.offers[i].price;
    numberOfOffer++;
  }
  var averagePrice = totalPrice / numberOfOffer;

  var priceFork;
  if (averagePrice < 50) {
    priceFork = 1;
  } else if (averagePrice < 70) {
    priceFork = 2;
  } else {
    priceFork = 3;
  }

  await ShopModel.updateOne(
    { shopName: req.body.shopName },
    { priceFork: priceFork }
  );

  res.json({ result: true });
});

/* route de validation de la base de données 
  -> reducer stockant toutes les infos du rdv choisis (reducer créé au moment de la validation du rdv sur la page détail coiffeur)  
*/
router.post('/addappointment/:token', async function (req, res, next) {
  console.log("REQ BODY APPOINT", req.body);
  var newAppointment = new AppointmentModel({
    chosenOffer: req.body.chosenOffer,
    chosenPrice: req.body.chosenPrice,
    chosenEmployee: req.body.chosenEmployee,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    chosenPayment: req.body.chosenPayment,
    appointmentStatus: req.body.appointmentStatus,
    shopId: req.body.shop_id,
    commentExists: false,
    dateForProfile: req.body.dateForProfile
  });

  var saveAppointment = await newAppointment.save();

  await ShopModel.updateOne(
    { _id: req.body.shop_id },
    { $push: { appointments: saveAppointment._id } }
  );

  await UserModel.updateOne(
    { token: req.params.token },
    { $push: { appointments: saveAppointment._id },
      $inc: {loyaltyPoints: req.body.loyaltyPoints},
    }
  );

  res.json({ result: true });
});

router.get('/shop/:id', async function (req, res, next) {
  var shop = await ShopModel.findById(req.params.id)
    .populate('appointments')
    .populate('comments')
    .exec();
  // console.log(shop);

  res.json({ result: true, shop: shop });
});


router.get('/favorites', async function (req, res, next){
  
  var favoriteShops = await UserModel.findOne({token: req.query.token})

var listID = []
favoriteShops.favorites.forEach((item)=>{
  listID.push(item)
})

 var foundFavorites =  await ShopModel.find({_id: { $in: listID} }).populate('comments').populate('appointments').exec()
  res.json({result: true, favoriteShops: foundFavorites})
})

router.post('/favorites', async function (req, res, next){
  
    await UserModel.updateMany(
    {token : req.body.token},
    {$push : {favorites: req.body.id}}
    )
    

    res.json({result: true})

})


router.post('/deleteFavorites', async function (req, res, next){
  
  await UserModel.updateMany(
  {token : req.body.token},
  {$pull : {favorites: req.body.id}}
  )

  res.json({result: true})

})

module.exports = router;

