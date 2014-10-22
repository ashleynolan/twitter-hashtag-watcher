
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema;

/**
 * QDT Schema
 */

var StateSchema = new Schema({
	hashtag				:	{	type : Schema.Types.ObjectId, ref : 'Hashtag'	},
	name				:	String,
	date				:	{	type : Date, default : Date.now					},
	count				:	Number
});


/**
 * Methods
 */

StateSchema.methods = {


}



/**
 * Statics
 */

StateSchema.statics = {

	/**
	* Find State by DB id, Tag and date
	*
	* @param {ObjectId} _id
	* @param {Function} cb
	* @api private
	*/

	load: function (hashtag, dateRange, cb) {

		if (dateRange === 'today') {
			var now = new Date(),
				today = new Date(now.getFullYear(), now.getMonth(), now.getDate());


			this.findOne({
				hashtag : hashtag,
				date: today
			})
				.exec(cb);
		}

	},


	/**
	* Return a global state for all symbols active today
	*
	* @param {Function} cb
	* @api private
	*/

	loadGlobalState: function (cb) {

		var now = new Date(),
			today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		this.find({
			date: today
		})
			.exec(cb);

	}

}

mongoose.model('State', StateSchema);
