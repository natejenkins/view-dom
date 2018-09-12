
$(document).ready(function(){
  var examples = {
    'ex1': {
      source:
      '<div>This sent&#x200A;ence h&#x200A;as some&#x200A; hard to see spaces</div>' +
      '<div>non-breaking&#x00A0spaces&#x00A0</div>' +
      '<div>ze&#x200B;ro-&#x200B;width sp&#x200B;aces</div>',
      setup: function() {

      }},
    'ex2': {
      source:
        '<div>line 1<br></div>'+
        '<div>line 2<br></div>'+
        '<div>3 <span>with an editable</span> and <span contentEditable="false">non-editable</span> span<br></div>' +
        '<div>line 4</div>',
      setup: function() {
        var rootNode = document.getElementById('source')

      }},
    'ex3': {
      source:
        '<div>This is a selection</div>'+
        '<div>across multiple lines</div>',
      setup: function(){
        var rootNode = document.getElementById('source')
        var range = document.createRange()
        var selection = window.getSelection()
        selection.removeAllRanges()
        range.setStart(rootNode.childNodes[0].childNodes[0], 3)
        range.setEnd(rootNode.childNodes[1].childNodes[0], 5)
        selection.addRange(range)
        vd.highlightRange(range)
        $('#d3').focus()
      }}
  }
  function setActiveTab(id){
    $('.tab').removeClass('active')
    if(id){
      $('#' + id).addClass('active')
    }
  }
  function setupExample(id){
    setActiveTab(id)
    $('#usage-content').hide('fast')
    if(examples[id]){
      source.innerHTML = examples[id].source
      vd.forceUpdate()
      examples[id].setup()
    }
  }
  function toggleUsage(id) {
    var el = $('#' + id)
    el.toggleClass('active')
    if(el.hasClass('active')){
      setActiveTab(id)
      $('#usage-content').show('fast')
    }
    else{
      setActiveTab()
      $('#usage-content').hide('fast')
    }
  }

  var source = document.getElementById('source')
  var d3Node = document.getElementById('d3')
  var vd = new ViewDom(source, d3Node)
  window.vd = vd
  setupExample('ex1')

  $('.example').click(e=>{
    setupExample(e.target.id)
  })
  $('#usage-button').click(e=>{
    toggleUsage(e.target.id)
  })

  $('#bold-button').click(e=>{
    document.execCommand('bold',false,null);
    vd.forceUpdate()
    setTimeout(() => { vd.update() }, 1)
  })
  $('#italic-button').click(e=>{
    document.execCommand('italic',false,null);
    vd.forceUpdate()
    setTimeout(() => { vd.update() }, 1)
  })
  $('#underline-button').click(e=>{
    document.execCommand('underline',false,null);
    vd.forceUpdate()
    setTimeout(() => { vd.update() }, 1)
  })
})

