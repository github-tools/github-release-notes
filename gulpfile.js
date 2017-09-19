const gulp = require('gulp');
const mocha = require('gulp-mocha');
const eslint = require('gulp-eslint');
const watch = require('gulp-watch');
const sass = require('gulp-sass');
const gulpIf = require('gulp-if');
const ghPages = require('gulp-gh-pages');
const babel = require('gulp-babel');

gulp.task('deploy', ['build'], function() {
  return gulp.src('./docs/**/*')
    .pipe(ghPages());
});

gulp.task('scripts', () => {
    gulp.src('./lib/src/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dest'));

    gulp.src('./lib/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('bin'));
});

gulp.task('lint', () => {
    const isFixed = file => file.eslint != null && file.eslint.fixed;

    return gulp.src('./lib/**/*.js')
        .pipe(
            eslint({
                fix: true,
                envs: [
                    'node'
                ]
            })
        )
        .pipe(eslint.format())
        .pipe(gulpIf(isFixed, gulp.dest('./lib/')));
});

gulp.task('watch', () => {
    return gulp.watch('./lib/**/*.js', ['lint', 'scripts']);
});

gulp.task('test', () => {
    return gulp.src(['test/*.js'])
        .pipe(mocha({
            compilers: 'js:babel-register'
        }));
});

gulp.task('build', ['lint', 'scripts'/*, 'test'*/]);
gulp.task('default', ['build', 'watch']);
