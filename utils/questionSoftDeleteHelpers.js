const { isDeepStrictEqual } = require('node:util');

function stripOptionIds(config = {}) {
    const cleanConfig = { ...config };

    if (Array.isArray(cleanConfig.options)) {
        cleanConfig.options = cleanConfig.options.map(
            ({ optionId, _id, ...rest }) => rest
        );
    }

    return cleanConfig;
}

function hasQuestionChanged(oldQ, newQ) {
    const oldPlain = JSON.parse(
        JSON.stringify(
            typeof oldQ.toObject === 'function' ? oldQ.toObject() : oldQ
        )
    );
    const newPlain = JSON.parse(JSON.stringify(newQ));

    return (
        oldPlain.type !== newPlain.type ||
        oldPlain.label !== newPlain.label ||
        Boolean(oldPlain.required) !== Boolean(newPlain.required) ||
        !isDeepStrictEqual(
            stripOptionIds(oldPlain.config),
            stripOptionIds(newPlain.config)
        )
    );
}
module.exports = { hasQuestionChanged };
