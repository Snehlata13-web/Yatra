const test = require('node:test');
const assert = require('node:assert/strict');
const validation = require('../src/modules/notices/notice.validation.js');

const execute = (middleware, body = {}, params = {}) => {
    let result = 'next';
    const response = {
        status(code) {
            return { json() { result = code; } };
        }
    };
    middleware({ body, params }, response, () => {});
    return result;
};

test('validates signed image and video upload requests', () => {
    assert.equal(execute(validation.validateUpload, {
        file_name: 'poster.png',
        content_type: 'image/png',
        file_size: 1024
    }), 'next');
    assert.equal(execute(validation.validateUpload, {
        file_name: 'clip.mp4',
        content_type: 'video/mp4',
        file_size: 1024
    }), 'next');
});

test('rejects unsupported, oversized, mismatched, or unexpected upload fields', () => {
    assert.equal(execute(validation.validateUpload, {
        file_name: 'script.html',
        content_type: 'text/html',
        file_size: 10
    }), 400);
    assert.equal(execute(validation.validateUpload, {
        file_name: 'poster.png',
        content_type: 'image/jpeg',
        file_size: 1024
    }), 400);
    assert.equal(execute(validation.validateUpload, {
        file_name: 'clip.mp4',
        content_type: 'video/mp4',
        file_size: 50 * 1024 * 1024 + 1
    }), 400);
    assert.equal(execute(validation.validateUpload, {
        file_name: 'poster.png',
        content_type: 'image/png',
        file_size: 1,
        path: 'other-warden/file.png'
    }), 400);
});

test('validates notice text and multiple safe media paths', () => {
    const request = {
        body: {
            title: '  Water shutdown ',
            body: '  Water will be unavailable from 10 AM to noon. ',
            media: [{
                path: 'warden-id/123e4567-e89b-12d3-a456-426614174000.png',
                content_type: 'image/png'
            }]
        }
    };
    let result = 'next';
    validation.validateCreate(request, {
        status(code) {
            return { json() { result = code; } };
        }
    }, () => {});
    assert.equal(result, 'next');
    assert.deepEqual(request.body, {
        title: 'Water shutdown',
        body: 'Water will be unavailable from 10 AM to noon.',
        media: [{
            path: 'warden-id/123e4567-e89b-12d3-a456-426614174000.png',
            content_type: 'image/png'
        }]
    });
});

test('rejects unsafe or invalid notice payloads and notice IDs', () => {
    assert.equal(execute(validation.validateCreate, {
        title: 'Notice',
        body: 'Text',
        media: Array.from({ length: 6 }, (_, index) => ({
            path: `warden-id/${index}.png`,
            content_type: 'image/png'
        }))
    }), 400);
    assert.equal(execute(validation.validateCreate, {
        title: '',
        body: 'Notice text'
    }), 400);
    assert.equal(execute(validation.validateCreate, {
        title: 'Notice',
        body: 'Text',
        created_by: 'attacker'
    }), 400);
    assert.equal(execute(validation.validateNoticeId, {}, { id: '1' }), 'next');
    assert.equal(execute(validation.validateNoticeId, {}, { id: '0' }), 400);
    assert.equal(execute(validation.validateNoticeId, {}, { id: '1abc' }), 400);
});
