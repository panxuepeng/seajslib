'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('seajs.json'),
    banner: '/* <%= grunt.template.today("yyyy-mm-dd")%> */\n',
    clean: {
      files: ['dist']
    },
    concat: {
        options: {
            banner: '<%= banner %>',
            stripBanners: true
        },
        debug: {
            src: ['src/seajs.js'],
            dest: '../../dist/<%= pkg.name %>/<%= pkg.version %>/<%= pkg.name %>-debug.js'
        }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.debug.src %>',
        dest: '../../dist/<%= pkg.name %>/<%= pkg.version %>/<%= pkg.name %>.js'
      },
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  
  // Default task.
  grunt.registerTask('default', ['clean', 'concat', 'uglify']);

};
