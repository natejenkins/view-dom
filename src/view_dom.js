/* global Node, CustomEvent, define */
import * as d3 from 'd3'

function ViewDom (domNode, viewNode, options) {
  options = options || {}
  this.rootNode = domNode
  var defaultOptions = {
    charMappings: {
      '\u200B': '*',
      '\u00A0': '_',
      '\u200A': '~',
    },
    duration: 200,
    minHeight: 20,
    verticalPadding: 20,
    fontSize: 1.0 // in rem units
  }
  this.options = Object.assign({}, defaultOptions, options)
  this.addEventListeners()

  this._svg   = d3.select(viewNode).append('svg').attr('width', '100%').attr('height', '10%')
  var w       = this._svg.node().getBoundingClientRect().width
  this._gRoot = this._svg.append('g').attr('transform', 'translate(' + w/2 + ',' + this.options.verticalPadding + ')')
    .attr('id', 'g-root')

  var htmlTag = document.getElementsByTagName('html')[0]
  var baseFontSize = window.getComputedStyle(htmlTag, null).getPropertyValue('font-size')
  baseFontSize = baseFontSize.replace('px', '')
  this._tree = d3.tree().nodeSize([1, this.options.fontSize*baseFontSize*3])
    .separation((a, b) => {
      var distance = (a.data.name.length + b.data.name.length)
      var spacing = 0.3*baseFontSize*distance*this.options.fontSize + 20
      return spacing
    })
  this.rectH = baseFontSize*2*this.options.fontSize
  this._root = this.parseElement(this.rootNode)
  this._root.x0  = 0
  this._root.y0  = 0
  this.newNodeId = 0

  var treeData = d3.hierarchy(this._root)
  this.nodes   = this._tree(treeData)
  this.links   = this.nodes.links()

  this.update = (source) => {
    if (!source) {
      source = this._root
    }

    var node = this._gRoot.selectAll('g.node')
      .data(this.nodes.descendants(), d => {
        return d.id || (d.id = ++this.newNodeId)
      })

    var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .on('click', this.click)

    nodeEnter.append('rect')
      .attr('height', this.rectH)
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('rx', 6)
      .attr('ry', 6)
      .style('fill', function (d) {
        return d._children ? 'lightsteelblue' : '#fff'
      })

    nodeEnter.append('text')
      .attr('y', this.rectH / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', this.options.fontSize + 'rem')
      .attr('font-family', 'Courier')
      .text(function (d) {
        return d.data.name
      })

    var nodeUpdate = node.transition()
      .duration(this.options.duration)
      .attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
    nodeUpdate.select('text')
      .style('fill-opacity', 1)
      .text(function (d) {
        return d.data.name
      })

    nodeUpdate.select('text').each(function (d, i) {
      d.bb = this.getBBox()
    })

    nodeUpdate.select('rect')
      .attr('x', function (d) {
        var width = d.data.name.length*8
        if (d.bb.width > 0) {
          width = d.bb.width + 10
        }
        return -width/2
      })
      .attr('width', function (d) {
        var width = d.data.name.length*8
        if (d.bb.width > 0) {
          width = d.bb.width + 10
        }
        return width
      })
      .attr('stroke', function (d) {
        if (d.data.highlighted && d.data.startOfRange && d.data.endOfRange) {
          return 'purple'
        } else if (d.data.highlighted && d.data.startOfRange) {
          return 'green'
        } else if (d.data.highlighted && d.data.endOfRange) {
          return 'red'
        }
        return 'black'
      })
      .attr('stroke-width', function (d) {
        return d.data.highlighted ? 3 : 1
      })
      .style('fill', function (d) {
        var n = d.data.node
        if (!d.data.isContentEditable) {
          return 'pink'
        } else if (n.nodeType === Node.TEXT_NODE) {
          return '#fff'
        } else {
          return 'lightblue'
        }
      })

    node.exit().transition()
      .duration(this.options.duration)
      .attr('transform', function (d) {
        return 'translate(' + 0 + ',' + 0 + ')'
      })
      .remove()

    var link = this._gRoot.selectAll('path.link').data(this.links)

    link.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('cursor', 'pointer')
      .style('fill', 'none')
      .on('click', this.click)

    link.transition()
      .duration(this.options.duration)
      .attr('stroke-width', 2)
      .attr('d', d3.linkVertical()
        .x(function (d) { return d.x })
        .y(d => { return d.y + this.rectH / 2 }))
      .attr('stroke', function (d) {
        if (d.source.data.highlighted) {
          if (d.source.data.highlightedChild && d.source.data.highlightedChild.data.node === d.target.data.node) {
            return 'green'
          }
        }
        if (d.source.data.endOfRange) {
          if (d.source.data.highlightedEndChild && d.source.data.highlightedEndChild.data.node === d.target.data.node) {
            return 'red'
          }
        }
        return '#ccc'
      })

    link.exit().transition()
      .duration(this.options.duration)
      .remove()

    this.nodes.each(function (d) {
      d.x0 = d.x
      d.y0 = d.y
    })
    setTimeout(this.resizeSvg, 1.2*this.options.duration)
  }

  this.resizeSvg = () => {
    var gRoot = document.getElementById('g-root')
    var bb = gRoot.getBBox()
    var newHeight = bb.height + this.options.verticalPadding + 10
    if (newHeight < this.options.minHeight) {
      newHeight = this.options.minHeight
    }
    this._svg.attr('height', newHeight)
  }

  this.click = (d) => {
    var event = new CustomEvent('ViewDom::NodeClicked',
      { 'detail':
        {
          'd3Node': d,
          'link': d.source,
          'node': d.data && d.data.node,
          'sourceNode': d.source,
          'targetNode': d.target,
          'startOfRange': !(d3.event.ctrlKey || d3.event.shiftKey)
        }
      })

    document.dispatchEvent(event)
    this.update()
  }
  this.parseRoot = () => {
    var oldNode
    this._new_root = this.parseElement(this.rootNode)
    var treeData = d3.hierarchy(this._new_root)
    this._new_nodes = this._tree(treeData)
    this._new_nodes.each(node => {
      oldNode = this.findNode(node)
      if (oldNode) {
        node.id  = oldNode.id
        node.x0  = oldNode.x0
        node.y0  = oldNode.y0
      }
    })
    this._root = this._new_root
    this.nodes = this._new_nodes
    this.links = this.nodes.links()
  }

  this.update()
  // this will update the bounding boxes which otherwise would be 0 upon page load
  setTimeout(this.update, 100)
}

var proto = ViewDom.prototype

proto.addEventListeners = function () {
  var _this = this
  var range = document.createRange()
  this.rootNode.onkeyup = function (e) {
    range = document.getSelection().getRangeAt(0)
    _this.parseRoot()
    _this.highlightRange(range)
    _this._current_range = range.cloneRange()
    setTimeout(() => { _this.update() }, 1)
  }
  this.rootNode.onmouseup = function (e) {
    range = document.getSelection().getRangeAt(0)
    _this._current_range = range.cloneRange()
    _this.highlightRange(range)
  }

  document.addEventListener('ViewDom::NodeClicked', function (e) {
    var node = e.detail.node
    var source = e.detail.sourceNode
    var target = e.detail.targetNode

    _this.rootNode.focus()
    var selection = window.getSelection()
    var r
    var index
    if (_this._current_range) {
      r = _this._current_range.cloneRange()
    } else {
      r = selection.getRangeAt(0)
    }
    selection.removeAllRanges()
    if (e.detail.startOfRange) {
      if (e.detail.link) {
        index = source.children.indexOf(target)
        r.setStart(source.data.node, index)
        r.setEnd(source.data.node, index)
      } else if (node) {
        r.setStart(node, 0)
        r.setEnd(node, 0)
      }
      _this._current_range = r.cloneRange()
    } else {
      if (e.detail.link) {
        index = source.children.indexOf(target)
        r.setEnd(source.data.node, index)
      } else if (node) {
        r.setEnd(node, 0)
      }
    }
    selection.addRange(r)
    _this.highlightRange(r)
  })
}
// For all non-text nodes, this returns the node name, DIV, SPAN, etc.
// For text nodes this returns the text content with certain characters which
// are normally not visible replaced by visible characters.
proto.d3NodeName = function (domNode) {
  if (domNode.nodeType === Node.TEXT_NODE) {
    var withReplacements = domNode.data
    Object.keys(this.options.charMappings).forEach(key => {
      withReplacements = withReplacements.replace(new RegExp(key, 'g'), this.options.charMappings[key])
    })
    return '\'' + withReplacements + '\''
  }
  return domNode.nodeName
}

proto.parseElement = function (el) {
  var res = {}
  var i
  var children = el.childNodes
  var childNode = null
  var numChildren = children.length
  res['name'] = this.d3NodeName(el)
  res['node'] = el
  res['children'] = new Array(numChildren)
  if (el.isContentEditable === undefined) {
    res['isContentEditable'] = true
  } else {
    res['isContentEditable'] = el.isContentEditable
  }
  for (i=0; i<numChildren; i++) {
    childNode = children[i]
    res['children'][i] = this.parseElement(childNode)
  }
  return res
}

proto.findNode = function (node) {
  var res = null

  this.nodes.each(n => {
    if (node.data.node === n.data.node) {
      res = n
    }
  })
  return res
}

proto.findD3NodeFromDomNode = function (domNode) {
  var temp = {
    data: {
      node: domNode
    }
  }
  return this.findNode(temp)
}

proto.highlightRange = function (range) {
  this.unHighlightAll()
  var sc = range.startContainer
  var so = range.startOffset
  var ec = range.endContainer
  var eo = range.endOffset
  var d3Node = this.findD3NodeFromDomNode(sc)
  var d3EndNode = range.collapsed ? null : this.findD3NodeFromDomNode(ec)
  var domNode
  if (d3Node) {
    domNode = d3Node.data.node
    d3Node.data.startOfRange = true
    if (domNode.nodeType === Node.TEXT_NODE) {
      d3Node.data.highlighted = true
      d3Node.data.name = d3Node.data.name.substr(0, so+1) + '|' + d3Node.data.name.substr(so+1)
    } else {
      d3Node.data.highlighted = true
      if (d3Node.children && d3Node.children.length > 0) {
        d3Node.data.highlightedChild = d3Node.children[so]
      }
    }
  }
  if (d3EndNode) {
    domNode = d3EndNode.data.node
    d3EndNode.data.endOfRange = true
    if (domNode.nodeType === Node.TEXT_NODE) {
      d3EndNode.data.highlighted = true
      // Name has already been updated by d3Node if statement
      if (d3EndNode === d3Node) {
        // we'll make the assumption that the insertions are ordered with eo > so
        d3EndNode.data.name = d3EndNode.data.name.substr(0, eo+2) + '|' + d3EndNode.data.name.substr(eo+2)
      } else {
        d3EndNode.data.name = d3EndNode.data.name.substr(0, eo+1) + '|' + d3EndNode.data.name.substr(eo+1)
      }
    } else {
      d3EndNode.data.highlighted = true
      if (d3EndNode.children && (d3EndNode.children.length > eo)) {
        d3EndNode.data.highlightedEndChild = d3EndNode.children[eo]
      } else if (d3EndNode.children && (d3EndNode.children.length > (eo - 1))) {
        d3EndNode.data.highlightedEndChild = d3EndNode.children[eo-1]
      }
    }
  }
  this.update()
}

proto.unHighlightAll = function () {
  this.nodes.each(n => {
    if (n.data.highlighted) {
      n.data.highlighted = false
      n.data.startOfRange = false
      n.data.endOfRange = false
      n.data.name = this.d3NodeName(n.data.node)
      n.data.highlightedChild = undefined
    }
  })
}

proto.forceUpdate = function () {
  this.parseRoot()
  this.update()
  this.update()
}

if (typeof define === 'function' && define.amd) {
  define([], function () {
    return {
      ViewDom: ViewDom
    }
  })
}
if (typeof exports !== 'undefined') {
  exports.ViewDom = ViewDom
}
if (typeof window !== 'undefined') {
  window.ViewDom = ViewDom
} else if (typeof global !== 'undefined') {
  global.ViewDom = ViewDom
}
