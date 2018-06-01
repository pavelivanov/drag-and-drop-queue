import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
import { forOwn, forEach } from 'lodash'
import {
  closest,
  events,
  vendorPrefix,
  limit,
  getElementMargin,
  getElementDimensions,
  provideDisplayName,
  omit,
} from '../utils'

import Manager from '../Manager'


const sortableContainer = (WrappedComponent) => {
  return class extends Component {

    constructor(props) {
      super(props)

      this.manager = new Manager()

      this.events = {
        start: this.handleStart,
        move: this.handleMove,
        end: this.handleEnd,
      }

      this.isMoved = false
      this.hoveredIndex = null

      this.state = {}
    }

    static displayName = provideDisplayName('sortableList', WrappedComponent)

    static defaultProps = {
      helperClass: null,
      onClick: () => {},
      onSortEnd: () => {},
      shouldCancelStart: () => {},
    }

    static childContextTypes = {
      manager: PropTypes.object.isRequired,
    }

    getChildContext() {
      return {
        manager: this.manager,
      }
    }

    componentDidMount() {
      this.container = findDOMNode(this)
      this.document = document
      this.scrollContainer = this.container

      this.bindEventListeners()
    }

    componentWillUnmount() {
      this.unbindEventListeners()
    }

    bindEventListeners() {
      forOwn(this.events, (event, key) => {
        events[key].forEach(eventName =>
          this.document.addEventListener(eventName, event)
        )
      })
      events.move.forEach(eventName =>
        this.container.addEventListener(eventName, this.handleSortMove, false)
      )
    }

    unbindEventListeners() {
      forOwn(this.events, (event, key) => {
        events[key].forEach(eventName =>
          this.document.removeEventListener(eventName, event)
        )
      })
      events.move.forEach(eventName =>
        this.container.removeEventListener(eventName, this.handleSortMove, false)
      )
    }


    nodeIsChild(node) {
      return node.sortableInfo.manager === this.manager
    }

    getOffset(event) {
      return {
        x: event.touches ? event.touches[0].clientX : event.clientX,
        y: event.touches ? event.touches[0].clientY : event.clientY,
      }
    }

    updateHelperPosition(event) {
      const offset = this.getOffset(event)
      const translate = {
        x: offset.x - this.initialOffset.x,
        y: offset.y - this.initialOffset.y,
      }

      this.helper.style[`${vendorPrefix}Transform`] = `translate3d(${translate.x}px, ${translate.y}px, 0)`
    }

    updateNodesPosition() {
      const nodes = this.manager.getOrderedRefs()
      const initialIndex = this.helper.instanceOf.sortableInfo.index
      const helperBounds = this.helper.getBoundingClientRect()

      for (let i = 0; i < nodes.length; i++) {
        const { node: { sortableInfo: { index: nodeIndex }, initialBounds: nodeBounds } } = nodes[i]

        const hovered = helperBounds.left > nodeBounds.left - nodeBounds.width / 2
                        && helperBounds.left < nodeBounds.left + nodeBounds.width / 2
                        && helperBounds.top > nodeBounds.top - nodeBounds.height / 2
                        && helperBounds.top < nodeBounds.top + nodeBounds.height / 2

        if (hovered) {
          this.hoveredIndex = nodeIndex
        }
      }

      // if no one node is hovered then return to not lose translates
      if (this.hoveredIndex === null) {
        return
      }

      const delta = this.hoveredIndex - initialIndex > 0 ? 1 : -1
      const lowIndex = delta > 0 ? initialIndex : this.hoveredIndex
      const highIndex = delta > 0 ? this.hoveredIndex : initialIndex

      forEach(nodes, ({ node }, index) => {
        let transformValue
        if (
          delta > 0 && index > lowIndex && index <= highIndex
          || delta < 0 && index >= lowIndex && index < highIndex
        ) {
          const { sortableInfo: { index: nodeIndex }, initialBounds: nodeBounds } = node
          const { node: { initialBounds: prevNodeBounds } } = this.manager.getByIndex(nodeIndex - delta)

          const translate = {
            x: prevNodeBounds.left - nodeBounds.left,
            y: prevNodeBounds.top - nodeBounds.top,
          }

          transformValue = `translate3d(${translate.x}px, ${translate.y}px, 0)`
        } else {
          transformValue = `translate3d(0, 0, 0)`
        }

        node.style[`${vendorPrefix}TransitionDuration`] = `${300}ms`
        node.style[`${vendorPrefix}Transform`] = transformValue
      })
    }


    handleStart = (event) => {
      const { shouldCancelStart } = this.props
      const node = closest(event.target, el => el.sortableInfo)

      if (
        node
        && node.sortableInfo
        && this.nodeIsChild(node)
        && !shouldCancelStart(event)
      ) {
        const { index } = node.sortableInfo
        this.manager.active = { index, node }
        this.handlePress(event)
      }
    }

    handlePress = (event) => {
      if (!this.manager.isActive()) {
        return
      }

      this.isMoved = false

      const { helperClass } = this.props

      const nodes = this.manager.getOrderedRefs()
      forEach(nodes, ({ node }) => {
        node.initialBounds = node.getBoundingClientRect()
      })

      const { node } = this.manager.getActive()
      const clonedNode = node.cloneNode(true)
      const bounds = node.getBoundingClientRect()
      const margin = getElementMargin(node)
      const dimensions = getElementDimensions(node)

      this.initialOffset = this.getOffset(event)

      this.helper = this.document.body.appendChild(clonedNode)
      this.helper.instanceOf = node

      if (helperClass) {
        this.helper.classList.add(helperClass)
      }

      this.helper.style.position      = 'fixed'
      this.helper.style.top           = `${bounds.top - margin.top}px`
      this.helper.style.left          = `${bounds.left - margin.left}px`
      this.helper.style.width         = `${dimensions.width}px`
      this.helper.style.height        = `${dimensions.height}px`
      this.helper.style.boxSizing     = 'border-box'
      this.helper.style.pointerEvents = 'none'
      this.helper.style.zIndex        = 600

      this.ghost = node

      this.ghost.style.visibility     = 'hidden'
      this.ghost.style.opacity        = 0
    }

    handleMove = (event) => {
      if (!this.manager.isActive()) {
        return
      }

      event.preventDefault()

      // const { node } = this.manager.getActive()
      // const bounds = node.getBoundingClientRect()

      this.updateHelperPosition(event)

      this.isMoved = true
    }

    handleEnd = (event) => {
      if (!this.manager.isActive()) {
        return
      }

      const { onClick, onSortEnd } = this.props
      const nodes = this.manager.getOrderedRefs()
      const index = this.helper.instanceOf.sortableInfo.index

      if (!this.isMoved) {
        onClick({ index })
      }
      else {
        onSortEnd({
          oldIndex: index,
          newIndex: this.hoveredIndex,
        })
      }

      forEach(nodes, ({ node }) => {
        node.style[`${vendorPrefix}TransitionDuration`] = ''
        node.style[`${vendorPrefix}Transform`] = ''
      })

      // Remove the helper from the DOM
      this.helper.parentNode.removeChild(this.helper)

      this.ghost.style.visibility     = ''
      this.ghost.style.opacity        = ''

      this.manager.active = null
    }


    handleSortMove = (event) => {
      if (!this.manager.isActive()) {
        return
      }

      this.updateNodesPosition()
    }


    render() {
      return (
        <WrappedComponent {...this.props} />
      )
    }
  }
}

export default sortableContainer
