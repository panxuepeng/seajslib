<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Baikeupload demo</title>
</head>

<body>
<div id="baikeupload1">上传图片</div>
<img id="image1"/>
<input type="text" id="pic_url1"/>

<div id="baikeupload2">上传图片</div>
<img id="image2"/>
<input type="text" id="pic_url2"/>

<div id="baikeupload3">上传图片</div>
<img id="image3"/>
<input type="text" id="pic_url3"/>

<script src="../libs/jquery/jquery.js"></script>
<script src="../../../dist/seajs/2.0.0pre/seajs.js" id="seajsnode"></script>
<script>
seajs.use('../src/baikeupload', function( ){
	
		//var url="{STATIC_IMG_SERVICE}{$this->user[useriden]}&host={echo urlencode($this->site_url.'/?m=attachment&a=uploadimg')}";
		var url="http://a5.att.baike.com/uploadImageForBaike.wiki?doc_title=&art_iden=&type=19&curuser_iden=HeWBmR0dnBn5ld3J4&host=<?php echo urlencode('http://commonjs.baike.com/lib/baikeupload/examples/upload.php');?>";
		
		$('#baikeupload1').baikeUpload({
			url: url,
			uploading: function(){
				
			},
			success: function( imgUrl ){
				$('#image1').attr('src', imgUrl);
				$('#pic_url1').val(imgUrl);
			},
			error: function(msg){
				alert(msg);
			},
			complete: function(){
				
			}
		});
		
		$('#baikeupload2').baikeUpload({
			url: url,
			uploading: function(){
				
			},
			success: function( imgUrl ){
				$('#image2').attr('src', imgUrl);
				$('#pic_url2').val(imgUrl);
			},
			error: function(msg){
				alert(msg);
			},
			complete: function(){
				
			}
		});
		
		$('#baikeupload3').baikeUpload({
			url: url,
			uploading: function(){
				
			},
			success: function( imgUrl ){
				$('#image3').attr('src', imgUrl);
				$('#pic_url3').val(imgUrl);
			},
			error: function(msg){
				alert(msg);
			},
			complete: function(){
				
			}
		});

	
});
</script>

</body>
</html>
