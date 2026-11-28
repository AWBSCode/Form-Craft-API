const Form = require('../models/formModel');

/**
 *
 * @param {string} userId
 * @param {stirng} formId
 * @returns bool
 */
module.exports = async (userId, formId) => {
    const form = await Form.findById(formId);

    return Boolean(form && form.creatorId.equals(userId));
};
