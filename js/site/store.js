// Shared state for the public site. Modules read from the store and call
// its methods to change things; it emits 'posts' / 'user' so views re-render
// without modules having to know about each other.
class Store extends EventTarget {
  posts = [];
  source = 'supabase'; // or 'samples' when Supabase is unreachable
  filter = 'all';
  user = null;

  get isAdmin() {
    return Boolean(this.user);
  }

  // ids are UUIDs from the database but numbers for sample posts, and come
  // back from data-id attributes as strings — compare as strings
  find(id) {
    return this.posts.find((p) => String(p.id) === String(id));
  }

  // What the grid shows: the active filter, and drafts only for the admin.
  get visiblePosts() {
    let list = this.filter === 'all' ? this.posts : this.posts.filter((p) => p.type === this.filter);
    if (!this.isAdmin) list = list.filter((p) => p.published !== false);
    return list;
  }

  setPosts(posts, source = this.source) {
    this.posts = posts;
    this.source = source;
    this._emit('posts');
  }

  addPost(post) {
    this.posts = [post, ...this.posts];
    this._emit('posts');
  }

  patchPost(id, fields) {
    const p = this.find(id);
    if (p) Object.assign(p, fields);
    this._emit('posts');
  }

  removePost(id) {
    this.posts = this.posts.filter((p) => String(p.id) !== String(id));
    this._emit('posts');
  }

  setFilter(filter) {
    this.filter = filter;
    this._emit('filter');
  }

  setUser(user) {
    this.user = user;
    this._emit('user');
  }

  _emit(type) {
    this.dispatchEvent(new Event(type));
  }
}

export const store = new Store();
