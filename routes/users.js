var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const uid2 = require('uid2');
const { signUpValidation, signInValidation } = require('../validation');
const UserModel = require('../models/users');
const CommentModel = require('../models/comments');
const AppointmentModel = require('../models/appointments');
const ShopModel = require('../models/shops');

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

/* route sign-up, création d'un compte client : 
  firstName
  lastName
  phoneNumber
  mail
  password
  favoris : si le reducer des favoris est rempli, les enregistrer en base de données
  status (remmplir dans la route en user par le dev)
  token (remplir dans la route par le dev)
  
  voir comment mettre en place google et facebook
*/
router.post('/signUp', async function (req, res, next) {
  /* création du token et du status en plus des input rempli par le user */
  // Validate the data before we make a user
  const { error } = signUpValidation(req.body);
  if (error) {
    return res.json({ result: false, error: error.details[0].message });
  }

  // Checking if the user is already in the DB
  const emailIsExist = await UserModel.findOne({ email: req.body.email });
  if (emailIsExist) {
    return res.json({ result: false, emaiExist: "l'email existe déjà" });
  }

  // Hash passwords
  const cost = 10;
  const hashedPassword = bcrypt.hashSync(req.body.password, cost);

  const newUser = new UserModel({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    password: hashedPassword,
    favorites: [],
    status: 'customer',
    token: uid2(32),
    loyaltyPoints: 0,
  });

  try {
    const savedUser = await newUser.save();
    console.log(savedUser);
    res.json({ result: true, savedUser, token: savedUser.token });
  } catch (error) {
    console.log(error);
    res.json({ result: false, error });
  }

  // if (user.token != null) {
  // Traitement de la réservation
  //   res.json({ result: true, token: user.token });
  // } else {
  //   res.json({ result: false });
  // }
});

/* route sign-in 
 mail
 password 
 token (récupéré dans la route par le dev)
*/
router.post('/signIn', async function (req, res, next) {
  let result = false;
console.log(req.body)
  // Lets validate the data before we make a user
  const { error } = signInValidation(req.body);

  if (error) {
    return res.json({ result: false, error: error.details[0].message });
  }

  // Checking if the email exists
  const user = await UserModel.findOne({ email: req.body.email });
  if (!user) {
    return res.json({
      result: false,
      emailNotFound: "L'e-mail est introuvable",
    });
  }

  // Password is correct
  const validPass = await bcrypt.compareSync(req.body.password, user.password);

  if (!validPass) {
    result = false;
    return res.json({
      result: false,
      invalidPassword: 'Mot de passe non associé',
    });
  } else {
    res.json({ result: true, user, token: user.token });
  }
});

// Get shops by id TEST
router.get('/shopsById/:id', async (req, res) => {
  try {
    const shops = await ShopModel.findById(req.params.id);
   
    res.json({ result: true, shops });
  } catch (error) {
    console.log(error);
    res.json({ result: false, error });
  }
});

// Delete Appointments IN SHOP MODEL TEST
router.delete('/delete-appoint/:idShop/:idAppoint', async (req, res) => {
  const idShop = req.params.idShop;
  const shop = await ShopModel.findOne({ _id: idShop });
  const appoints = shop.appointments;

  const removedAppoint = await appoints.remove({
    _id: req.params.idAppoint,
  });
  await shop.save();

  res.json({ removedAppoint });
});

// Delete Appointments IN USER MODEL TEST
router.delete('/delete-user-appoint/:idUser/:idAppoint', async (req, res) => {
  const idUser = req.params.idUser;
  const user = await UserModel.findOne({ _id: idUser });
  const appoints = user.appointments;

  const removedAppoint = await appoints.remove({
    _id: req.params.idAppoint,
  });
  await user.save();

  res.json({ removedAppoint });
});

/* route stripe */

/* route à l'entrée de la page 'communiquer avec mon coiffeur' accessible juste après la validation ET depuis la page rdv à venir, pensez à ajouter un bouton ignorer */
router.get('/myDetails', function (req, res, next) {
  // récupère via le token gender, hairType, hairLength, image
});

/* route au bouton validation de la page 'communiquer avec mon coiffeur, envoie les infos au coiffeur. il y a un bouton ignore qui n'envoie rien. la validation renvoie vers la page profil*/
router.put('/myDetails', async function (req, res, next) {
  await UserModel.updateOne(
    {token : req.body.token},
    {gender: req.body.gender, hairType: req.body.hairType, hairLength: req.body.hairLength}
  );

  res.json({ result: true });
});

/* route profil: depuis la validation de la com avec coiffeur et depuis le drawer si connecté*/
router.get('/myProfile/:token', async function (req, res, next) {
  // récupère firstname, lastname, loyaltyPoints, rdv futurs, rdv passés
  // rdv futurs : il y a un bouton qui amène vers myDetails
  // rdv passés : il y a un bouton qui amène vers comment


  //A priori le populate ne sert plus après changement de méthode
  const tokenUser = req.params.token;
  const user = await UserModel.findOne({ token: tokenUser })
    .populate('appointments')
    .exec();

  const appointIds = [];
  user.appointments.forEach((userAppoint) => {
    appointIds.push(userAppoint._id);
  });

  try {
    // Get all appointments by user
    const appointments = await AppointmentModel.find({
      _id: { $in: appointIds },
    });

    // Get all shopsId by user
    const shopsIds = [];
    appointments.forEach((appointment) => {
      shopsIds.push(appointment.shopId);  
    });
//? For EACH ne fonctionne pas avec un await, il faudrait lui rajouter un setTimeout mais du coup on préfère passer avec une boucle for classique
    const shops = [];
    for (let i = 0; i < shopsIds.length; i++) {
      const shop = await ShopModel.findById(shopsIds[i]);
      shops.push(shop);
    }

    res.json({ result: true, appointments, user, shopsIds, shops });
  } catch (error) {
    res.json({ result: false, error });
  }
});

/* route en post depuis le profil : un bouton sur chaque rdv passés, ouvre un overlay avec un input pour le commentaire, un input pour la note */
router.put('/addcomment', async function (req, res, next) {
  var shop = await ShopModel.findById(req.body.shop_id);

  var newComment = new CommentModel({
    comment: req.body.comment,
    rating: +req.body.rating,
    commentDate: new Date(),
  });

  var saveComment = await newComment.save();

  await UserModel.updateOne(
    { token: req.body.token },
    { $push: { comments: saveComment._id } }
  );

  await ShopModel.updateOne(
    { _id: req.body.shop_id },
    { $push: { comments: saveComment._id } }
  );

  var newRating =
    (+req.body.rating + shop.rating * shop.comments.length) /
    (shop.comments.length + 1);

  await ShopModel.updateOne({ _id: req.body.shop_id }, { rating: newRating });

  await AppointmentModel.updateOne(
    { _id: req.body.appointmentId },
    { commentExists: true }
  );

  res.json({ result: true, comment: saveComment });
});

module.exports = router;
