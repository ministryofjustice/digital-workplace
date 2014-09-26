$(function(){
  'use strict';

  var baseUrl = $x.url($('base').attr('href')).segment(['guidance_and_support_2', 'index']).param('v', '2');
  var baseUrlSegmentsLength = baseUrl.urlParts.segments.length;

  var GuidanceAndSupport2 = function(){
    this.$topContainer = $('.content-guidance-and-support-2 .content');

    if(!this.$topContainer.length){ return; }

    this.cacheEls();
    this.bindEvents();
    this.deepLink();
  };

  GuidanceAndSupport2.prototype = {
    cacheEls: function(){
      this.$categories = this.$topContainer.find('.categories > li');
      this.$subcategoriesContainer = this.$topContainer.find('.subcategories-container');
      this.$linksContainer = this.$topContainer.find('.links-container');
      this.$categoryLabel = this.$subcategoriesContainer.find('.category-label');
    },

    bindEvents: function(){
      var _this = this;

      this.$categories.on('click', 'a', function(e){
        e.preventDefault();
        _this.showSubcategories($(this).closest('li'));
      });
    },

    cleanUpSubcategories: function(){
      var $currentSubcategories = this.$subcategoriesContainer.find('.subcategories');

      if($currentSubcategories.length){
        $currentSubcategories.appendTo($currentSubcategories.data('original-parent'));
      }

      this.$categories.removeClass('selected');
    },

    showSubcategories: function($el){
      var label = $el.find('> a').text();

      //clean up first
      this.cleanUpSubcategories();

      //show subcategories from newly selected category
      $el.find('.subcategories').data('original-parent', $el).appendTo(this.$subcategoriesContainer);
      $el.addClass('selected');
      this.$categoryLabel.text(label);
      this.updateUrl($el);
    },

    updateUrl: function($category){
      var segment = $category.data('category-name');

      window.history.pushState({}, '', baseUrl.clone().segment(segment).get());
      this.retrieveCategorySegment();
    },

    retrieveCategorySegment: function(){
      return $x.url(true).segment(baseUrlSegmentsLength);
    },

    deepLink: function(){
      var categorySegment = this.retrieveCategorySegment();
      if(categorySegment){
        this.$categories.removeClass('selected');
        var $currentCategory = this.$categories.filter('[data-category-name="'+categorySegment+'"]');
        $currentCategory.addClass('selected');
        this.showSubcategories($currentCategory);
      }
    }
  };

  App.GuidanceAndSupport2 = GuidanceAndSupport2;
});
