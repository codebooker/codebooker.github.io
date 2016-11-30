christmasText("p.christmas");

function christmasText(elements) {
  $(elements).each(function() {
    var chars = $(this).text().split("");
    $(this).text("");

    for (var i = 0; i < chars.length; i++) {
      if (i % 2 == 0)
      {
        $(this).append('<span class="christmas-red">' + chars[i] + '</span>');
      }
      else
      {
        $(this).append('<span class="christmas-green">' + chars[i] + '</span>');
      }
    }
  });
}