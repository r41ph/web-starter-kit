let gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync').create(),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    // CSS
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    minifyCSS = require('gulp-clean-css'),
    rename = require("gulp-rename"),
    sass = require('gulp-sass'),
    focus = require('postcss-focus'),
    csslint = require('gulp-csslint'),
    htmlReporter = require('gulp-csslint-report'),
    uncss = require('gulp-uncss'),
    styleGuide = require('postcss-style-guide'),
    // Javascript
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat');


gulp.task('default', ['serve'], () => {
    gulp.start('browserify', 'css', 'scripts');
});

/**
 * Browserify to Load our Dependencies
 */
gulp.task('browserify', () => {
    return browserify('./assets/js/dependencies.js').bundle()
        .pipe(source('bundle-dependencies.js'))
        .pipe(gulp.dest('./dist/js/'));
});

/**
 * Process JS files and return main script.
 */
gulp.task('scripts', ['browserify'], () => {
    console.log("Script bundle, concatenate, minify and sourcemap files");
    return gulp.src([
        './dist/js/bundle-dependencies.js', // file containing all the bundle dependencies from ./assets/js/dependencies.js
        './assets/js/scripts.js' // Custom scripts
    ])
    .pipe(sourcemaps.init())
    // .pipe(uglify())
    .pipe(concat('scripts.min.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js/'))
    .pipe(browserSync.stream()); // browsers reload after tasks are complete.
});

/**
 * Launch Browsersync and watch files
 */
gulp.task('serve', () => {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
    gulp.watch("./assets/css/*.scss", ['css']);
    gulp.watch(['./assets/js/*.js'], ['scripts']);
    gulp.watch("./*.html").on('change', browserSync.reload);
});

/**
 * Transpiling scss, autoprefix, minifying, sourcemaps, :focus, creating styleguide
 */
gulp.task('css', () => {
    console.log("Transpiling scss, etc...");
    return gulp.src('./assets/css/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([ require('postcss-focus') ]))
        .pipe(postcss([ autoprefixer({ grid: false }) ])) //  IE supports only grid-row with / and span. You should add grid: false option to Autoprefixer and use some JS grid polyfill for full spec support
        // .pipe(csslint()) // Uncomment these three for CSS lint reports in /csslint-reports folder
        // .pipe(csslint.formatter()) // A bit annoying using it all the time while developement
        // .pipe(htmlReporter({
        //     'filename': 'csslint-report.html',
        //     'directory': './csslint-reports/'
        // }))
        .pipe(postcss([
            styleGuide({
                project: 'Project name',
                dest: 'styleguide/index.html',
                showCode: true,
                theme: 'tomato'
            })
        ]))
        .pipe(minifyCSS({compatibility: 'ie8'}))
        .pipe(rename({
          suffix: '.min'
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist/css/'))
        .pipe(browserSync.stream()); // browsers reload after tasks are complete.
});

// Remove every unused selectors from the css files -> https://www.npmjs.com/package/gulp-uncss/
// NEED TESTING!!!!!!!!!!!!
gulp.task('purgecss', () => {
    console.log("Purging CSS...");
    return gulp.src('dist/css/*.css')
        .pipe(uncss({
            html: ['index.html']
        }))
        .pipe(gulp.dest('dist/css/purgecss'))
});