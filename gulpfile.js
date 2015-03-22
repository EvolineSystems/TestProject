'use strict';

// Plugins
var gulp = require('gulp');
var sequence = require('run-sequence');
var jshint = require('gulp-jshint');
var clean = require('gulp-clean');
var concat   = require('gulp-concat');
var ejs = require('gulp-ejs');
var sass = require('gulp-ruby-sass');
var sort = require('sort-stream');
var order = require("gulp-order");
var watch = require('gulp-watch');
var wrap = require('gulp-wrap');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var minifyHTML = require('gulp-minify-html');
var cssmin = require('gulp-cssmin');
var svgSprite = require("gulp-svg-sprites");
var autoprefixer = require('gulp-autoprefixer');
var tap = require('gulp-tap');

// Configuration
var config = {
  src: {
    path: 'src',
    pathVendors: 'bower_components',
    js: ['src/app.js', 'src/**/*.js'],
    ejs: 'src/*.ejs',
    ejsIndex: 'src/index.ejs',
    tpl: 'src/**/*.html',
    scss: 'src/**/*.scss',
    svgIcons: 'src/assets/icons/**/*.svg',
    svgFilters: 'src/assets/filters/**/*.svg',
    fonts: 'src/assets/**/*.woff',
    docs: 'src/assets/**/*.csv',
    img: 'src/**/*.png',
    vendors: {
      js: [

        /* should be before angular to replace ng.element */
        'bower_components/jquery/dist/jquery.min.js',

        'bower_components/angular/angular.min.js',
        'bower_components/angular-animate/angular-animate.min.js',
        'bower_components/gsap/src/minified/TweenMax.min.js',
        'bower_components/angular-ui-router/release/angular-ui-router.min.js',
        'bower_components/angular-gsapify-router/angular-gsapify-router.js',
        'bower_components/angular-resource/angular-resource.min.js',
        'bower_components/angular-sanitize/angular-sanitize.min.js',

        'bower_components/angular-strap/src/helpers/dimensions.js',
        'bower_components/angular-strap/src/tooltip/tooltip.js',
        'bower_components/angular-strap/src/popover/popover.js',

        'bower_components/moment/min/moment-with-locales.min.js',

        'bower_components/kefir/dist/kefir.min.js',

        'bower_components/hammerjs/hammer.min.js',
        'bower_components/angular-hammer/angular-hammer.js',
        'bower_components/jquery-ui/jquery-ui.min.js',
        'bower_components/keyboard/dist/js/jquery.keyboard.min.js',
        'bower_components/iScroll/build/iscroll-probe.js',
        'bower_components/angular-iscroll/dist/lib/angular-iscroll.js',
        'bower_components/angular-ui-select/dist/select.min.js'
      ],
      css: [
        'bower_components/normalize.css/normalize.css',
        'bower_components/keyboard/dist/css/keyboard.min.css'
      ]
    },
    vendorsMaps: {
      js: [
        'bower_components/jquery/dist/jquery.min.map',
        'bower_components/angular/angular.min.js.map',
        'bower_components/angular-animate/angular-animate.min.js.map',
        'bower_components/angular-sanitize/angular-sanitize.min.js.map',
        'bower_components/angular-resource/angular-resource.min.js.map',
        'bower_components/kefir/dist/kefir.min.js.map',
        'bower_components/hammerjs/hammer.min.map'
      ]
    }
  },
  dist: {
    path: 'dist',
    assets: '/assets',
    fonts: '/fonts',
    svgFilters: '/assets/filters',

    // Dev
    dev: 'dist/dev',
    devJsTitle: 'app.js',
    devScssTitle: 'app.scss',
    devVendorsCssTitle: 'vendors.css',
    devAssetsIconsFile: 'css/svg-sprite.css',
    devVendorsJsTitle: 'vendors.js',

    // Prod
    prod: 'dist/prod',
    prodJsTitle: 'app.min.js',
    prodScssTitle: 'app.min.scss',
    prodVendorsCssTitle: 'vendors.min.css',
    prodAssetsIconsFile: 'css/svg-sprite.min.css',
    prodVendorsJsTitle: 'vendors.min.js'
  }
};
var jsFilesArr = [];
var jsFilesVendorsArr = [];
var buildType;
var env;
var prodTasks;
var prodEnvs;

// Lint Task
gulp.task('lint', function () {
  var toLintArr = (config.src.js).concat([
    // ToDo: move to bower dependencies
    '!src/components/collapse/collapse-directive.js',
    '!src/components/dataset-polyfill/dataset-polyfill.js'
  ]);

  return gulp.src(toLintArr)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Clean Dist Task
gulp.task('clean', function () {
  return gulp.src(config.dist.path, {read: false})
    .pipe(clean());
});


/* Build Section */

// Vendors JS
gulp.task('jsVendorsDev', function () {
  return gulp.src(config.src.vendors.js, {base: "."})
    .pipe(tap(function (file) {
      var path = file.path;
      var indexToCut = path.indexOf(config.src.pathVendors);

      if (indexToCut > -1) {
        path = path.substr(indexToCut);
      }

      jsFilesVendorsArr.push(path);
    }))
    .pipe(gulp.dest(config.dist[buildType]));
});

gulp.task('jsVendors', function () {
  return gulp.src(config.src.vendors.js)
    .pipe(concat(config.dist[buildType + 'VendorsJsTitle']))
    .pipe(uglify({
      mangle: false
    }))
    .pipe(gulp.dest(config.dist[buildType]));
});

// Vendors Maps
gulp.task('jsVendorsMaps', function () {
  return gulp.src(config.src.vendorsMaps.js, {base: "."})
    .pipe(gulp.dest(config.dist[buildType]));
});

// Dev App JS
gulp.task('jsAppDev', function () {
  return gulp.src(config.src.js)
    .pipe(wrap('(function(ng){\n\'use strict\';\n<%= contents %>\n})(this.angular);'))
    .pipe(sort(function (a, b) {
      var aScore = a.path.match(/-module.js/) ? 0 : 1;
      var bScore = b.path.match(/-module.js/) ? 0 : 1;

      return aScore - bScore;
    }))
    .pipe(tap(function (file) {
      var path = file.path;
      var indexToCut = path.indexOf(config.src.path);

      if (indexToCut > -1) {
        indexToCut += (config.src.path).length;

        path = path.substr(indexToCut);
      }

      jsFilesArr.push(path);
    }))
    .pipe(gulp.dest(config.dist[buildType]));
});

// App JS
gulp.task('jsApp', function () {
  return gulp.src(config.src.js)
    .pipe(wrap('(function(ng){\n\'use strict\';\n<%= contents %>\n})(this.angular);'))
    .pipe(sort(function (a, b) {
      var aScore = a.path.match(/-module.js/) ? 0 : 1;
      var bScore = b.path.match(/-module.js/) ? 0 : 1;

      return aScore - bScore;
    }))
    .pipe(concat(config.dist[buildType + 'JsTitle']))
    .pipe(gulpif(buildType === 'prod', uglify({
      mangle: false
    })))
    .pipe(gulp.dest(config.dist[buildType]));
});

// EJS
gulp.task('ejsDev', function () {
  return gulp.src(config.src.ejs)
    .pipe(ejs({
      env: env,
      jsFilesArr: jsFilesArr,
      jsFilesVendorsArr: jsFilesVendorsArr
    }))
    .pipe(gulp.dest(config.dist[buildType]));
});

gulp.task('ejsProd', function () {
  return gulp.src(config.src.ejsIndex)
    .pipe(ejs({
      env: env
    }))
    .pipe(gulp.dest(config.dist[buildType]));
});

// Templates
gulp.task('templates', function () {
  return gulp.src(config.src.tpl)
    .pipe(gulpif(buildType === 'prod', minifyHTML({
      empty: true,
      comments: true,
      conditionals: true,
      spare: true,
      quotes: true
    })))
    .pipe(gulp.dest(config.dist[buildType]));
});

// Vendors CSS
gulp.task('cssVendors', function () {
  return gulp.src(config.src.vendors.css)
    .pipe(concat(config.dist[buildType + 'VendorsCssTitle']))
    .pipe(gulpif(buildType === 'prod', cssmin()))
    .pipe(gulp.dest(config.dist[buildType]));
});

// Sass
gulp.task('scss', function () {
  return gulp.src(config.src.scss)
    .pipe(order([
      '**/config.scss',
      '**/placeholders.scss',
      '**/mixins.scss',
      '**/*.scss'
    ]))
    .pipe(concat(config.dist[buildType + 'ScssTitle']))
    .pipe(gulpif(buildType === 'dev', sass({
      'sourcemap=none': true
    }), sass({
      'sourcemap=none': true,
      style: 'compressed'
    })))
    .pipe(autoprefixer({
      browsers: ['last 2 Chrome versions', 'last 2 Firefox versions', 'last 2 Safari versions', 'last 2 IE versions']
    }))
    .pipe(gulp.dest(config.dist[buildType]));
});

// SVG Icons
gulp.task('svgIcons', function () {
  return gulp.src(config.src.svgIcons)
    .pipe(gulpif(buildType === 'dev', svgSprite({
      cssFile: config.dist[buildType + 'AssetsIconsFile'],
      selector: 'icon_%f'
    }), svgSprite({
      cssFile: config.dist[buildType + 'AssetsIconsFile'],
      preview: false,
      selector: 'icon_%f'
    })))
    .pipe(gulpif(buildType === 'prod', cssmin()))
    .pipe(gulp.dest(config.dist[buildType] + config.dist.assets));
});

// SVG Filters
gulp.task('svgFilters', function () {
  return gulp.src(config.src.svgFilters)
    .pipe(gulp.dest(config.dist[buildType] + config.dist.svgFilters));
});

// Fonts
gulp.task('fonts', function () {
  return gulp.src(config.src.fonts)
    .pipe(gulp.dest(config.dist[buildType]));
});

// Docs
gulp.task('docs', function () {
  return gulp.src(config.src.docs)
    .pipe(gulp.dest(config.dist[buildType]));
});

// Watch
gulp.task('watch', function () {
  // EJS
  gulp.watch(config.src.ejs, ['ejsDev']);

  // Templates
  gulp.watch(config.src.tpl, ['templates']);

  // App JS
  gulp.watch(config.src.js, ['lint', 'jsAppDev']);

  // Sass
  gulp.watch(config.src.scss, ['scss']);

  // Svg
  gulp.watch(config.src.assets, ['svgIcons']);
  gulp.watch(config.src.assets, ['svgFilters']);
});

/* Main Tasks */

// Dev Task
gulp.task('dev', ['clean'], function () {
  buildType = 'dev';
  env = 'DEV';
  sequence('lint', 'jsVendorsDev', 'jsVendorsMaps', 'jsAppDev', 'ejsDev', 'templates',
    'cssVendors', 'scss', 'svgIcons', 'svgFilters', 'fonts', 'docs', 'watch');
});

// Prod Tasks
prodTasks = ['jsVendors', 'jsVendorsMaps', 'jsApp', 'ejsProd', 'templates', 'cssVendors', 'scss', 'svgIcons', 'svgFilters', 'fonts', 'docs'];
prodEnvs = ['DEV', 'QA', 'STAGING', 'PROD'];

prodEnvs.forEach(function (envType) {
  gulp.task(envType.toLowerCase(), ['clean'], function () {
    buildType = 'prod';
    env = envType;
    sequence(prodTasks);
  });
});

// Default Task
gulp.task('default', ['dev']);
