const crypto = require('crypto');
const slugify = require('slugify');

function generateFormSlug(title) {
    const base = slugify(title || '', {
        lower: true,
        strict: true,
        trim: true
    });
    const suffix = crypto.randomBytes(3).toString('hex'); // 6-char collision guard
    return base ? `${base}-${suffix}` : `form-${suffix}`;
}

module.exports = generateFormSlug;
