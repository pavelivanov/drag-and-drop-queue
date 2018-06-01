import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'

import { provideDisplayName, omit } from '../utils'


const sortableElement = (WrappedComponent) => {
  return class extends Component {
    
    static displayName = provideDisplayName('sortableElement', WrappedComponent)

    static contextTypes = {
      manager: PropTypes.object.isRequired,
    }

    componentDidMount() {
      const { disabled } = this.props

      if (!disabled) {
        this.setDraggable()
      }
    }

    componentWillUnmount() {
      const { disabled } = this.props

      if (!disabled) {
        this.removeDraggable()
      }
    }

    setDraggable() {
      const { manager } = this.context
      const { index } = this.props
      const node = (this.node = findDOMNode(this))

      node.sortableInfo = {
        index,
        manager,
      }

      this.ref = { node }
      manager.add(this.ref)
    }

    removeDraggable() {
      const { manager } = this.context

      manager.remove(this.ref);
    }

    render() {
      return (
        <WrappedComponent {...this.props} />
      )
    }
  }
}

export default sortableElement
