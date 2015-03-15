$(document).ready(function(){
  $("#new-comment").submit(function(e){
    e.preventDefault();
    var comment = $("#new-comment").find("textarea").val(),
    name = $("#currentIdUser").val();
    $("#currentIdUser").text("");
    $.post("/newcomment",{uname:name,comment:comment},function(data){

    });
  });
});
