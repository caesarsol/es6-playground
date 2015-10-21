import gulp from 'gulp'
import browserify from 'browserify'
import watchify from 'watchify'
import babelify from 'babelify'
import rimraf from 'rimraf'
import source from 'vinyl-source-stream'
import sass from 'gulp-sass'
import browserSyncModule from 'browser-sync'
import autoprefixer from 'gulp-autoprefixer'
import gutil from 'gulp-util'

let browserSync = browserSyncModule.create()

const config = {
  inFiles: {
    html: 'src/*.html',
    js:   'src/app.es6.js',
    css:  'src/style.{sass,scss,css}',
  },
  outDir: 'build/',
  outFiles: {
    js:   'app.js',
  },
}

gutil.log('Starting!')

function logError(err) {
  gutil.log(
    `[${gutil.colors.blue(err.plugin)}] ${gutil.colors.red('Error:')}`,
    `${gutil.colors.red(err.messageFormatted || err.message)}`
  )
  gutil.log(err)
}

function getBundler() {
  if (!global.bundler) {
    let conf = {
      entries: [config.inFiles.js],
      debug: true,
    }
    Object.assign(conf, watchify.args)
    global.bundler = watchify(browserify(conf))
  }
  return global.bundler
}

gulp.task('clean', function (cb) {
  return rimraf(config.outDir, cb)
})

gulp.task('server', function () {
  return browserSync.init({
    server: {baseDir: config.outDir},
    ui: false,
  })
})

gulp.task('js', function () {
  return getBundler().on('error', logError)
    .transform(babelify).on('error', logError)
    .bundle().on('error', logError)
    .pipe(source(config.outFiles.js))
    .pipe(gulp.dest(config.outDir))
    .pipe(browserSync.stream())
})

gulp.task('sass', function () {
  return gulp.src(config.inFiles.css)
    .pipe(sass()).on('error', logError)
    .pipe(autoprefixer({ browsers: ['> 5% in IT', 'ie >= 8'] }))
    .pipe(gulp.dest(config.outDir))
    .pipe(browserSync.stream())
})

gulp.task('html', function () {
  return gulp.src(config.inFiles.html)
    .pipe(gulp.dest(config.outDir)) // Just copy.
    .pipe(browserSync.stream())
})

gulp.task('watch', ['clean', 'server', 'js', 'sass', 'html'], function () {
  // FIXME: initial build is done two times
  getBundler().on('update', () => gulp.start('js'))
  gulp.watch(config.inFiles.css, ['sass'])
  gulp.watch(config.inFiles.html, ['html'])
})
