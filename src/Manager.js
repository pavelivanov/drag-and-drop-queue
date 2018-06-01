import { find, sortBy } from 'lodash'


export default class Manager {

  refs = []

  add(ref) {
    this.refs.push(ref)
  }

  remove(ref) {
    const index = this.getIndex(ref)

    if (index !== -1) {
      this.refs.splice(index, 1)
    }
  }

  isActive() {
    return Boolean(this.active)
  }

  getActive() {
    return this.active
    //return find(this.refs, ({ node }) => node.sortableInfo.index == this.active.index)
  }

  getIndex(ref) {
    return this.refs.indexOf(ref)
  }

  getByIndex(index) {
    return find(this.refs, ({ node }) => node.sortableInfo.index === index)
  }

  getOrderedRefs() {
    return sortBy(this.refs, ({ node }) => node.sortableInfo.index)
  }
}
