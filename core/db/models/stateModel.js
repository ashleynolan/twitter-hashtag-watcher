
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('core/config')[env],
  Schema = mongoose.Schema;

/**
 * QDT Schema
 */

var StateSchema = new Schema({
	tag				:	{	type : Schema.Types.ObjectId, ref : 'Tag'	},
	name				:	String,
	date				:	{	type : Date, default : Date.now			},
	count				:	Number
});


/**
 * Methods
 */

StateSchema.methods = {


};



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

	load: function (tag, dateRange, cb) {

		var now = new Date(),
			dateToQuery;

		if (dateRange === 'today') {
			dateToQuery = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		} else if (dateRange === 'yesterday') {
			dateToQuery = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
		} else {
			dateToQuery = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
		}

		this.findOne({
			tag : tag,
			date: dateToQuery
		})
		.exec(cb);

	},


	loadAll: function (tag, cb) {

		this.find({
			tag : tag
		}).sort({ date : 1})
			.exec(cb);

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
