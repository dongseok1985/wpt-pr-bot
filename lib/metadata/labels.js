"use strict";
var funk = require('../funk');

var LEGACY_NAMES = {
    "canvas2d": "2dcontext",
    "crypto-api": "WebCryptoAPI",
    "csp": "CSP",
    "DOMCore": "dom",
    "pagevisibility": "page-visibility",
    "PointerEvents": "pointerevents",
    "ProgressEvents": "progress-events",
    "SelectorsAPI": "selectors-api",
    "ServerSentEvents": "eventsource",
    "ShadowDOM": "shadow-dom",
    "WebMessaging": "webmessaging",
    "WebSockets": "websockets",
    "WebStorage": "webstorage",
    "Workers": "workers",
    "imports": "html-imports",
    "rtl-reference.html": "html",
    "rtl-test.html": "html",
    "cors": "fetch",
    "XMLHttpRequest": "xhr"
};

var LABEL_TO_FILENAMES = {
    "assets": ["fonts", "images", "media", "common"],
    "infra": [
        "examples",
        "harness",
        "infrastructure",
        "LICENSE",
        "reporting",
        "resources",
        "tools"
    ],
    "old-tests": ["old-tests"]
};
// The directories listed here will not be used to create labels
var PRUNED_SUBDIRECTORIES = ["css"];

// Files located within the following directories will receive a label named
// according to the first sub-directory.
var SUB_DIRECTORIES = ["css", "tools"];

var SUB_DIRECTORIES_REGEXP = new RegExp("^(?:" + SUB_DIRECTORIES.join("|") + ")/");

function _fromSubDir(context) {
    var truncated = context.path.replace(SUB_DIRECTORIES_REGEXP, "");
    var labels = [];

    if (truncated !== context.path) {
        labels = _fromRootDir({
            path: truncated,
            labels: context.labels
        }).labels;
    }

    return {
        path: context.path,
        labels: context.labels.concat(labels)
    };
}

function _fromRootDir(context) {
    var label;
    var dirName = context.path.split('/')[0];

    if (dirName === context.path || PRUNED_SUBDIRECTORIES.indexOf(dirName) > -1) {
        return context;
    }

    if (LEGACY_NAMES[dirName]) {
        label = LEGACY_NAMES[dirName];
    } else {
        for (var candidate in LABEL_TO_FILENAMES) {
            if (LABEL_TO_FILENAMES[candidate].indexOf(dirName) > -1) {
                label = candidate;
            }
        }
    }

    if (!label) {
        label = dirName;
    }

    return {
        path: context.path,
        labels: context.labels.concat(label)
    };
}

function _fromRootFile(context) {
    var isRootFile = context.path && context.path.indexOf("/") === -1;

    return {
        path: context.path,
        labels: isRootFile ? context.labels.concat("infra") : context.labels
    };
}

var _pathToLabel = funk.compose(_fromRootFile, _fromRootDir, _fromSubDir);

/**
 * Derive a list of GitHub issue tags from a lists of modified file names in
 * web-platform-tests.
 *
 * @param {Array<string>}
 *
 * @returns {Array<string>}
 */
exports.fromFiles = function(filenames) {
    return filenames
        .map(function(filename) { return { path: filename, labels: [] }; })
        .map(_pathToLabel)
        .reduce(function(labels, context) {
            return labels.concat(context.labels);
        }, [])
        .filter(function(filename) { return filename !== ""; })
        .filter(function(filename, index, filenames) {
            return filenames.indexOf(filename) === index;
        });
};

/**
 * Derive a list of GitHub issue tags from a list of working group names.
 *
 * @param {Array<string>} workingGroups
 *
 * @returns {Array<string>}
 */
exports.fromWorkingGroups = function labels(workingGroups) {
    return workingGroups.map(function(shortname) { return "wg-" + shortname; })
};
