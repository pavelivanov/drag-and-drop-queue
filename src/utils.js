export const vendorPrefix = (function() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '' // server environment
  // fix for:
  //    https://bugzilla.mozilla.org/show_bug.cgi?id=548397
  //    window.getComputedStyle() returns null inside an iframe with display: none
  // in this case return an array with a fake mozilla style in it.
  const styles = window.getComputedStyle(document.documentElement, '') || ['-moz-hidden-iframe']
  const pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1]

  switch (pre) {
    case 'ms':
      return 'ms'
    default:
      return pre && pre.length ? pre[0].toUpperCase() + pre.substr(1) : ''
  }
})()

export const events = {
  start: ['touchstart', 'mousedown'],
  move: ['touchmove', 'mousemove'],
  end: ['touchend', 'touchcancel', 'mouseup'],
}

export function omit(obj, ...keysToOmit) {
  return Object.keys(obj).reduce((acc, key) => {
    if (keysToOmit.indexOf(key) === -1) acc[key] = obj[key]
    return acc
  }, {})
}

export function closest(el, fn) {
  while (el) {
    if (fn(el)) {
      return el
    }
    el = el.parentNode
  }
}

export function limit(min, max, value) {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

function getCSSPixelValue(stringValue) {
  if (stringValue.substr(-2) === 'px') {
    return parseFloat(stringValue)
  }
  return 0
}

export function getElementMargin(element) {
  const style = window.getComputedStyle(element)

  return {
    top: getCSSPixelValue(style.marginTop),
    right: getCSSPixelValue(style.marginRight),
    bottom: getCSSPixelValue(style.marginBottom),
    left: getCSSPixelValue(style.marginLeft),
  }
}

export function getElementDimensions(element) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
  }
}

export function provideDisplayName(prefix, Component) {
  const componentName = Component.displayName || Component.name

  return componentName ? `${prefix}(${componentName})` : prefix
}
