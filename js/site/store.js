// Shared state for the public site. Modules read from the store and call
// its methods to change things; it emits 'posts' / 'filter' so views
// re-render without modules having to know about each other.
class Store extends EventTarget {
  posts = [];
  source = 'supabase'; // or 'samples' when Supabase is unreachable
  filter = 'all';

  // ids are UUIDs from the database but numbers for sample posts, and come
  // back from data-id attributes as strings — compare as strings
  find(id) {
    return this.posts.find((p) => String(p.id) === String(id));
  }

  // What the grid shows: published posts matching the active filter.
  // (If you're signed in to admin.html in the same browser, the database
  // also returns your drafts — they're still kept off the public site.)
  get visiblePosts() {
    const published = this.posts.filter((p) => p.published !== false);
    return this.filter === 'all' ? published : published.filter((p) => p.type === this.filter);
  }

  setPosts(posts, source = this.source) {
    this.posts = posts;
    this.source = source;
    this._emit('posts');
  }

  setFilter(filter) {
    this.filter = filter;
    this._emit('filter');
  }

  _emit(type) {
    this.dispatchEvent(new Event(type));
  }
}

export const store = new Store();
