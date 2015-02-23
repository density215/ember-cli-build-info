/* jshint node: true */
'use strict';

var execSync = require('child_process').execSync;

module.exports = {
    name: 'ember-cli-build-info',

    /**
     * Collect Build Info data
     */
    included: function (app, parentAddon) {
        var target = (parentAddon || app);
        var info;
        var commit;

        var defaultOptions = {
            metaTemplate: false, // 'VERSION: {VERSION} SHA: {COMMIT}',
            injectedKey: 'buildInfo',
            vcsFlavor: 'svn'
        };

        this.options = target.options.buildInfoOptions || {};

        // merge options
        for (var option in defaultOptions) {
            if (!this.options.hasOwnProperty(option)) {
                this.options[option] = defaultOptions[option];
            }
        }

        // build info object
        info = {
            version: this.project.pkg.version || ''
        };

        if (this.options.vcsFlavor === 'git') {

            info.desc = execSync('git describe --tags --long --always') || null;
            if (typeof info.desc === 'string') {
                commit = info.desc.split('-').pop();

                // remove the prepended `g`
                if (commit[0] === 'g') {
                    commit = commit.substr(1);
                }

                info.commit = commit;
            }
        }

        else if (this.options.vcsFlavor === 'svn') {
            var svn = execSync('svn info') || null,
                descObj = {};
            svn.split('\n').forEach(function (l) {
                var kv = l.split(': ');
                descObj[kv[0]] = kv[1];
            });
            info.desc = '-rev' + descObj.Revision;
            info.author = descObj['Last Changed Author'];
            info.date = descObj['Last Changed Date'];
        }
        // store the info
        this.info = info;

    },

    /**
     * Expose the data on the APP object.
     * FIXME: I doubt this is the best way to do this..
     */
    config: function (env, config) {
        config.APP.BUILD_INFO = this.info;
    },

    /**
     * Inject a <meta> tag with the build info as the content.
     */
    contentFor: function (type) {
        var info = this.info;
        var options = this.options;
        var output;

        if (type === 'head') {
            //abort meta tag injection if there's no template
            if (!options.metaTemplate) {
                return;
            }

            output = options.metaTemplate
                .replace(/\{VERSION\}/g, info.version)
                .replace(/\{DESC\}/g, info.desc)
                .replace(/\{COMMIT\}/g, info.commit)
                .replace(/\{AUTHOR}/g, info.author)
                .replace(/\{DATE}/g, info.date);

            return '<meta name="build-info" content="' + output + '"/>';
        }
    }
};
