
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema;





var HashtagSchema = new Schema({
	tagname	: String
});

/**
 * Symbol Schema
 */

var SymbolSchema = new Schema({
	name				:	{	type : String, unique: true },
	createdOn			:	{	type : Date, default : Date.now				},
	lastUpdated			:	{	type : Date, default : Date.now				},

	hashtags			:  [HashtagSchema]
});



/**
 * Methods
 */

SymbolSchema.methods = {

};



/**
 * Statics
 */

SymbolSchema.statics = {

  /**
   * Find symbol by name
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

	load: function (symbolName, cb) {
		this.findOne({ name : symbolName })
			.exec(cb);
	},

	/**
	* Find all questions
	*
	* @param {Function} cb
	* @api private
	*/

	loadAll: function (cb) {

		// this.find().sort({ 'name': -1 })
		// 	.exec(cb);
		this.find().sort({ name : 1})
			.exec(cb);

	},


	removeHashtag: function (symbol, name) {

		console.log('removing hashtag' + name)

	},

  /**
   * Find all hashtags
   *
   * @param {Function} cb
   * @api private
   */

	getAllTags: function (cb) {

		var tags = [];

		this.find({}, { hashtags: 1 }, function (err, symbols) {

			if (err) return handleError(err);

			symbols.forEach(function (q) {

				for (var i = 0; i < q.hashtags.length; i++) {

					var hashtag = q.hashtags[i];

					console.log(i);

					this.pushToTagArray(tags, hashtag);
				}
			});

			cb(tags);
		});

	},


	pushToTagArray: function (array, val) {
		console.log(array.has(val));
		var exists = this.isInArray(array, val);

		//if the value doesn't exist in our array
		if (!exists) {
			tags.push(val);
		}
	},

	isInArray: function (array, value) {
		return array.indexOf(value) > -1;
	}

};

mongoose.model('Symbol', SymbolSchema);
