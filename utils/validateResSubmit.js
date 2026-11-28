function _isEmptyValue(value) {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
}

function _fail(questionId, message) {
    return { isValid: false, questionId, message };
}

function _checkAnswerRange(q, ans, defaultMin, defaultMax) {
    if (typeof ans.value !== 'string') {
        return _fail(q.questionId, 'answer value must be a string');
    }

    const ansLen = ans.value.trim().length;
    const min = q?.config?.min ?? defaultMin;
    const max = q?.config?.max ?? defaultMax;

    if (ansLen < min || ansLen > max) {
        return _fail(
            q.questionId,
            `answer length must be between ${min} and ${max}`
        );
    }

    return { isValid: true };
}

function _handleChoices(q, ans, isSingleChoice) {
    const chosen = ans.value;

    if (!Array.isArray(chosen)) {
        return _fail(q.questionId, 'chosen options must be an array');
    }

    if (q.required && chosen.length === 0) {
        return _fail(q.questionId, 'chosen options can not be empty');
    }

    if (isSingleChoice && chosen.length > 1) {
        return _fail(
            q.questionId,
            'in single-choice, you can only choose one answer'
        );
    }

    const uniqueChosen = new Set(chosen);
    if (uniqueChosen.size !== chosen.length) {
        return _fail(q.questionId, 'duplicate options are not allowed');
    }

    const activeOptionIds = new Set(
        (q?.config?.options || [])
            .filter((el) => !el.archived)
            .map((el) => el.optionId)
    );

    for (const opt of uniqueChosen) {
        if (!activeOptionIds.has(opt)) {
            return _fail(q.questionId, 'option does not exist or is archived');
        }
    }

    return { isValid: true };
}

function _handleNumber(q, ans, defaultMin, defaultMax) {
    if (typeof ans.value !== 'number' || !Number.isFinite(ans.value)) {
        return _fail(q.questionId, 'answer value must be a valid number');
    }

    const min = q?.config?.min ?? defaultMin;
    const max = q?.config?.max ?? defaultMax;

    if (ans.value < min || ans.value > max) {
        return _fail(q.questionId, `number must be between ${min} and ${max}`);
    }

    return { isValid: true };
}

function _handleBoolean(q, ans) {
    if (typeof ans.value !== 'boolean') {
        return _fail(q.questionId, 'answer value must be a boolean');
    }
    return { isValid: true };
}

const qTypesValidation = {
    short_text: (q, ans) => _checkAnswerRange(q, ans, 1, 25),
    long_text: (q, ans) => _checkAnswerRange(q, ans, 20, 300),
    single_choice: (q, ans) => _handleChoices(q, ans, true),
    multi_choice: (q, ans) => _handleChoices(q, ans, false),
    rating: (q, ans) => _handleNumber(q, ans, 1, 5),
    number: (q, ans) => _handleNumber(q, ans, 1, 1000),
    boolean: (q, ans) => _handleBoolean(q, ans)
};

function validator(form, response) {
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
        return _fail(null, 'response answers must be an object');
    }

    if (form.settings?.expiresAt && form.settings.expiresAt <= new Date.now()) {
        return _fail(null, 'the form is expired');
    }

    const activeMap = new Map();
    for (const q of form.questions) {
        if (!q.archived) activeMap.set(q.questionId, q);
    }

    // 1. Check all required questions are present and non-empty
    for (const [id, q] of activeMap.entries()) {
        if (!q.required) continue;

        const ans = Object.hasOwn(response, id) ? response[id] : null;
        if (!ans || typeof ans !== 'object' || _isEmptyValue(ans.value)) {
            return _fail(id, 'this question is required');
        }
    }

    // 2. Validate every submitted answer
    for (const [id, ans] of Object.entries(response)) {
        if (!activeMap.has(id)) {
            return _fail(id, 'this question is not found or is archived');
        }

        if (!ans || typeof ans !== 'object' || Array.isArray(ans)) {
            return _fail(id, 'invalid answer format');
        }

        const q = activeMap.get(id);

        if (q.type !== ans.type) {
            return _fail(id, 'question and answer do not have the same type');
        }

        if (!Object.hasOwn(qTypesValidation, ans.type)) {
            return _fail(id, 'answer type is strange or unhandled');
        }

        // Skip constraint checks for optional questions submitted with an empty value
        if (!q.required && _isEmptyValue(ans.value)) {
            continue;
        }

        const typeValidation = qTypesValidation[ans.type](q, ans);
        if (!typeValidation.isValid) {
            return typeValidation;
        }
    }

    return { isValid: true };
}

module.exports = validator;
