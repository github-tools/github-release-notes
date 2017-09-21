const gulp = require('gulp');
const mocha = require('gulp-mocha');
const eslint = require('gulp-eslint');
const watch = require('gulp-watch');
const sass = require('gulp-sass');
const gulpIf = require('gulp-if');
const ghPages = require('gulp-gh-pages');
const babel = require('gulp-babel');
const chmod = require('gulp-chmod');
const nodeunit = require('gulp-nodeunit');

gulp.task('deploy', ['build'], function() {
  return gulp.src('./docs/**/*')
    .pipe(ghPages());
});

gulp.task('scripts', () => {
    gulp.src('./lib/src/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dist'));

    gulp.src('./lib/src/**/*.json')
        .pipe(gulp.dest('dist'));

    gulp.src('./lib/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(chmod(0o755))
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
    gulp.src('test/**/*.js')
        .pipe(nodeunit({
            reporter: 'junit',
            reporterOptions: {
                output: 'test'
            }
        }));
});

gulp.task('build', ['lint', 'scripts', 'test']);
gulp.task('default', ['build', 'watch']);
