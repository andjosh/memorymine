/*
 * API Routes
 */
var Account = require('../models/account')
    , Memory = require('../models/memory');
var error404 = {"error":{"code":404,"message":"Nothing found by that identifier."}},
    error400 = {"error":{"code":400,"message":"RedFeather doesn't understand what you mean."}},
    updated204 = {"success":{"code":204,"message":"Successfully updated."}};

module.exports = function (app, io, ensureApiAuth) {

}
