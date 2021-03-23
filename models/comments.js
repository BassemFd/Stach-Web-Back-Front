var mongoose = require('mongoose');

var commentSchema = mongoose.Schema({
    comment: String,
    rating: Number,
    commentDate: Date,
});

var CommentModel = mongoose.model('comments', commentSchema);

module.exports = CommentModel;