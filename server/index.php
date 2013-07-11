<?php

# This file passes the content of the Readme.md file in the same directory
# through the Markdown filter. You can adapt this sample code in any way
# you like.

# Install PSR-0-compatible class autoloader
spl_autoload_register(function($class){
	require preg_replace('{\\\\|_(?!.*\\\\)}', DIRECTORY_SEPARATOR, ltrim($class, '\\')).'.php';
});

# Get Markdown class
use \Michelf\Markdown;

$names = array('Readme', 'use', 'changelog', 'libs');

foreach($names as $name){
	# Read file and pass content through the Markdown praser
	$text = file_get_contents("../docs/$name.md");
	$text= Markdown::defaultTransform($text);

	file_put_contents("../docs/$name.html", $text);
}

echo 'OK';
