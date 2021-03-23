var mongoose = require('mongoose');

var options = {
    connectTimeoutMS: 5000,
    useNewUrlParser: true,
    useUnifiedTopology : true
}
mongoose.connect('mongodb+srv://admin:lacapsule@cluster0.8wqyi.mongodb.net/StachPerso?retryWrites=true&w=majority',
    options,
    function(err) {
    console.log(err);
});