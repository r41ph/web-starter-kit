let gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync').create(),
    source = require('vinyl-source-stream'),
    path = require('path'),
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
    concat = require('gulp-concat'),
    browserify = require('browserify'),
    // SVG
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    svgSprite = require('gulp-svg-sprite');

gulp.task('default', ['serve'], () => {
    gulp.start('css', 'scripts', 'svg');
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
    console.log("==> Scripts bundle, concatenate, minify and sourcemap files");
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
    // watch if we add new icons to the folder
    // don't add ./ as it stops working ¯\_(ツ)_/¯
    gulp.watch(['assets/icons/*'], ['svg']);
});

/**
 * Transpiling scss, autoprefix, minifying, sourcemaps, :focus, creating styleguide
 */
gulp.task('css', () => {
    console.log("==> Transpiling scss, etc...");
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

/**
 * Combine all svg sources into single svg file and create svg <view> and 
 * scss file for using icons directly in the CSS like: 
 * <i class="acw-icon--camera">camera</i>
 * Change icon size with => transform: scale(2);
 * More info and config: 
 *  => https://github.com/jkphl/gulp-svg-sprite
 *  => https://github.com/jkphl/svg-sprite
 *  => http://jkphl.github.io/svg-sprite/#json
 */
var config = {
    shape               : {
        dimension       : {         // Set maximum icon dimensions
            maxWidth    : 24,
            maxHeight   : 24
        },
        spacing         : {         // Add padding to each icon in the sprite
            padding     : 0
        }
    },
    mode                : {
        view            : {         // Activate the «view» mode
            dest        : "../../dist/css/",  // creates .svg sprite file location
            bust        : false,
            prefix      : ".acw-icon--", // Dont remove the dot 
            layout      : "vertical", // creates a vertical sprite
            example     : {
                dest    : "../../styleguide/icons-guide.html"
            },
            render      : {
                scss        : { // Activate Sass output (with default options)
                    dest        : "../../assets/css/_svg-sprite", // scss file location (relative to 'config>mode>view>dest : "../../dist/css/"')
                },      
                css     : false
            }
        },
        symbol          : false      // Activate the «symbol» mode
    }
};

gulp.task('svg', () => {
    console.log("==> Creating SVG sprite with all SVG icons in /assets/icons");
    return gulp.src('**/*.svg', {cwd: './assets/icons/'})
    .pipe(svgSprite(config)).on('error', function(error){ console.log("createsvg task error: " + error); })
    .pipe(gulp.dest('./assets/css'));
});


/**
 * Remove every unused selector from the css files -> https://www.npmjs.com/package/gulp-uncss/
 * NEED TESTING!!!!!!!!!!!!
 */
// gulp.task('purgecss', () => {
//     console.log("Purging CSS...");
//     return gulp.src('dist/css/*.css')
//         .pipe(rename({prefix: 'purged-'}))
//         .pipe(uncss({
//             html: ['*.html']
//         }))
//         .pipe(gulp.dest('dist/css/purgecss'))
// });