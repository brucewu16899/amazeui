'use strict';

/* jshint node: true */

var path = require('path');
var format = require('util').format;
var del = require('del');
var runSequence = require('run-sequence');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var replace = require('gulp-replace');
var sassPath = './dist/sass';
var paths = {
  scss: path.join(sassPath, 'scss'),
  widget: path.join(sassPath, 'widget')
};

gulp.task('sass:clean', function(callback) {
  del(sassPath, callback);
});

gulp.task('sass:copy:less', function() {
  return gulp.src('./less/*.less')
    .pipe($.rename(function(path) {
      path.extname = '.scss';
    }))
    .pipe(gulp.dest(paths.scss));
});

gulp.task('sass:copy:components', function() {
  return gulp.src('./widget/**/*')
    .pipe($.rename(function(path) {
      if (path.extname === '.less') {
        path.extname = '.scss';
      }
    }))
    .pipe(gulp.dest(paths.widget));
});

gulp.task('sass:convert', function() {
  return gulp.src([
    paths.scss + '/*.scss',
    paths.widget + '/*/src/*.scss'
  ])
    // change less/ dir to scss/ on imports
    .pipe(replace(/\/less\//g, '/scss/'))
    // gradient filter
    .pipe(replace(/filter:\s*e\(\%\("progid:DXImageTransform\.Microsoft\.gradient\(startColorstr='\%d',\s*endColorstr='\%d',\s*GradientType=(\d)\)",\s*argb\((@.+)*\),\s*argb\((@.*)\)\)\)/g, function(all, $1, $2, $3) {
      return format("filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='\#{ie-hex-str(%s)}', endColorstr='\#{ie-hex-str(%s)}', GradientType=%d)", $2, $3, $1);
    }))
    // reset-filter()
    .pipe(replace(/filter:\s*e\(\%\(.+\)\);/g, 'filter: progid:DXImageTransform.Microsoft.gradient(enabled = false);'))
    // change .less extensions to .scss on imports
    .pipe(replace(/\.less/g, '.scss'))
    // convert variables
    .pipe(replace(/@/g, '$'))
    // convert escape function
    .pipe(replace(/ e\(/g, ' unquote('))
    // covert mixin
    .pipe(replace(/\.([\w-]*)\s*\((.*)\)\s*\{/g, function(match, $1, $2) {
      return '@mixin ' + $1 + '(' + $2.replace(/;/g, ',') + ') {';
    }))
    // gradient mixins
    .pipe(replace(/\.(gradient-[\w-]+[\d\w]*)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // button.less
    .pipe(replace(/\.(button-\w+)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // form.less
    .pipe(replace(/\.(form-field-\w+)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // nav.less
    .pipe(replace(/\.nav-tabs-justify(\(\))?;/g, '@include nav-tabs-justify();'))
    // caret: .caret-up
    .pipe(replace(/\.(caret-\w+)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // .size() in .square
    .pipe(replace('.size($size; $size);', '@include size($size, $size);'))
    // .square();
    .pipe(replace(/\.square\((.*)\);/g, '@include square($1);'))
    // .border-*-radius();
    .pipe(replace(/\.(border-\w+-radius)\((.*)\)/g, '@include $1($2)'))
    // comment.less
    .pipe(replace(/\.(comment-highlight-variant)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // icon.less: .icon-btn-size();
    .pipe(replace(/\.(icon-btn-size)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // input-group.less
    .pipe(replace(/\.(input-group-color-variant)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // list.less
    .pipe(replace(/\.(list-item.*)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // panel.less
    .pipe(replace(/\.(panel-variant)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // progress.less
    .pipe(replace(/\.(progress-bar-variant)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // utility.less
    .pipe(replace(/\.(spacing-.*|text-align-variant|angle-\w+-variant)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);',
          $1, $2.replace(/;/g, ',').replace(/~/g, 'unquote'));
      }))
    // plugin style
    .pipe(replace(/\.(alert-variant|nav-divider)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // widgets style
    .pipe(replace(/\.(line-clamp-height|max-thumb-height)\((.*)\);/g,
      function(match, $1, $2) {
        return format('@include %s(%s);', $1, $2.replace(/;/g, ','));
      }))
    // .clearfix
    .pipe(replace(/\.clearfix(\(\))?;/g, '@include clearfix;'))
    // .am-icon-font();
    .pipe(replace(/\.am-icon-font(\(\))?;/g, '@include am-icon-font;'))
    .pipe(replace(/\.tab-focus(\(\))?;/g, '@include tab-focus;'))
    .pipe(replace(/\.(text-hide|angle-base|reset-filter)(\(\))?;/g, '@include $1();'))
    // .text-overflow()
    .pipe(replace(/\.(text-overflow|scrollable)\((.*)\);/g, '@include $1($2);'))
    // media query variables
    .pipe(replace(/[\$|@]media\s*(\$\w+-?\w+)\s*\{/g, '@media #{$1} {'))
    // comment empty mixins
    .pipe(replace(/@mixin ([\w\-]*)\s*\((.*)\)\s*\{\s*\}/g, '// @mixin $1($2){}'))
    // hook calls
    .pipe(replace(/\.(hook[a-zA-Z\-\d]+)(\(\))?;/g, '// @include $1();'))
    .pipe(replace(/\$(import|media|font-face|page|-ms-viewport|keyframes|-webkit-keyframes)/g, '@$1')) // replace valid '@' statements
    .pipe(replace(/(\$[\w\-]*)\s*:(.*);\n/g, '$1: $2 !default;\n'))    // make variables optional
    .pipe(replace(/\$\{/g, '#{$'))                                      // string literals: from: /~"(.*)"/g, to: '#{"$1"}'
    // string literals: for real
    .pipe(replace(/~("[^"]+")/g, 'unquote($1)'))
    .pipe(gulp.dest(function(file) {
      if (file.path.indexOf('/widget/') > -1) {
        return paths.widget;
      }
      return paths.scss;
    }));
});

gulp.task('sass:replace', function() {
  return gulp.src(['amui.scss', 'amazeui.scss'], {cwd: paths.scss})
    .pipe(replace('@import "grid.scss";', ''))
    .pipe(replace('@import "block-grid.scss";', ''))
    .pipe(replace('@import "table.scss";', ''))
    .pipe(gulp.dest(paths.scss));
});

gulp.task('sass', function(callback) {
  runSequence(
    'sass:clean',
    ['sass:copy:less', 'sass:copy:components'],
    'sass:convert',
    'sass:replace',
    callback);
});
