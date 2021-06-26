//gulpfile.js
let gulp = require('gulp');
let pug = require('gulp-pug');
let stylus = require('gulp-stylus');
let del = require('del');

// Get one .styl file and render
gulp.task('styles', function () {
    return gulp.src('./src/*.styl')
        .pipe(stylus())
        .pipe(gulp.dest('./dist'));
});

gulp.task('pug', function () {
    return gulp.src('./src/*.pug')
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('dist'));
});


gulp.task('script', function () {
    return gulp.src('./src/trumpet.js')
        .pipe(gulp.dest('dist/'));
});

gulp.task('audio', function () {
    return gulp.src('./assets/**/*.mp3')
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function(cb) {
    // You can use multiple globbing patterns as you would with `gulp.src`
    return del(['dist'], cb);
});


gulp.task('build', gulp.series("clean",gulp.parallel("styles", "pug", "audio", "script")));

gulp.task('default', gulp.series('build'))