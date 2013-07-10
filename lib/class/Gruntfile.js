'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('seajs.json'),
    
    banner: '/* <%= grunt.template.today("yyyy-mm-dd h:MM:ss")%> */\n',
   // banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
    //  '<%= grunt.template.today("yyyy-mm-dd h:MM:ss") %>\n' +
    //  '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
   //   ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    //     '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
    clean: {
      files: ['dist']
    },
    transport: {
        target: {
            options: {
                pkg: 'seajs.json',
                format: '{{name}}/{{version}}/{{filename}}'
            },
            files: [{
                cwd: 'src',
                src: ['**/*.js', '**/*.css'],
                dest: 'dist'
            }]
        }
    },
    concat: {
        options: {
            banner: '<%= banner %>',
            stripBanners: true
        },
        debug: {
            src: ['dist/*-debug.js'],
            dest: '../../dist/<%= pkg.name %>/<%= pkg.version %>/<%= pkg.name %>-debug.js'
        },
        dist: {
            src: ['dist/*.js', '!dist/*-debug.js'],
            dest: 'dist/concat/all.js'
        },
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: '../../dist/<%= pkg.name %>/<%= pkg.version %>/<%= pkg.name %>.js'
      },
    },
    copy: {
      main: {
        files: [{
            expand: true,
            cwd: 'src/',
            src: ['**/*.css', '**/*.gif', '**/*.png', '**/*.jpg'],
            dest: '../../dist/<%= pkg.name %>/<%= pkg.version %>/',
            filter: 'isFile'
        },
        {
            // 打包组件时，同时将其发布到 huimg 目录
            // 注意：
            // 需要根据自己huimg目录适当修改dest当中的路径
            expand: true,
            cwd: '../../dist/<%= pkg.name %>/<%= pkg.version %>/',
            src: ['**/*'],
            dest: 'D:/hudong/huimg/libs/<%= pkg.name %>/<%= pkg.version %>/',
            filter: 'isFile'
        }
        ]
      }
    },

    // check
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      gruntfile: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          jshintrc: 'src/.jshintrc'
        },
        src: ['src/**/*.js']
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/**/*.js']
      },
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src', 'qunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'qunit']
      },
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-cmd-transport');
  grunt.loadNpmTasks('grunt-contrib-copy');
  
  // Default task.
  grunt.registerTask('default', ['clean', 'transport', 'concat', 'uglify', 'copy']);
  grunt.registerTask('check', ['jshint', 'qunit']);

};
