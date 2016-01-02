import Ember from 'ember';
import Webdav from 'davros/lib/webdav';
import jQuery from 'jquery';

export default Ember.Mixin.create({
  davBase: '/remote.php/webdav',

  load: function() {
    return Webdav.propfind(this.get('rawPath')).then((xml) => {
      let responses = [...xml.querySelectorAll('response')];

      this.loadFromResponse(responses.shift());

      if(responses.length > 0) {
        this.loadChildren(responses);
      }

      return this;
    });
  },

  delete: function() {
    return Webdav.delete(this.get('rawPath'));
  },

  loadFromResponse: function(response) {
    let doc = jQuery(response);
    let path = doc.find('href').text();
    path = path.slice(this.get('davBase.length') + 1).replace(/\/$/, '');
    let isDirectory = doc.find('collection').length > 0;
    this.set('path', decodeURIComponent(path));
    this.set('isDirectory', isDirectory);
    this.set('mtime', new Date(doc.find('getlastmodified').text()));

    if(isDirectory) {
      this.set('size', parseInt(doc.find('quota-used-bytes').text(), 10));
      this.set('files', []);
    } else {
      this.set('size', parseInt(doc.find('getcontentlength').text(), 10) || 0);
    }
  },

  loadChildren: function(responses) {
    var files = [];
    for(var i = 0; i < responses.length; i++) {
      var file = this.constructor.create();
      file.loadFromResponse(responses[i]);
      files.push(file);
    }
    this.set('files', files);
  }
});
