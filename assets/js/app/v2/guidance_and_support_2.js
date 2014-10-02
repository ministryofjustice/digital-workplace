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
      this.$categoriesContainer = this.$topContainer.find('.categories');
      this.$categories = this.$categoriesContainer.find(' > li');
      this.$subcategoriesContainer = this.$topContainer.find('.subcategories-container');
      this.$linksContainer = this.$topContainer.find('.links-container');
      this.$categoryLabel = this.$subcategoriesContainer.find('.category-label');
      this.$sortList = this.$topContainer.find('.sort');
      this.$sortPopular = this.$sortList.find('[data-sort-type="popular"]');
      this.$sortAlphabetical = this.$sortList.find('[data-sort-type="alphabetical"]');
    },

    bindEvents: function(){
      var _this = this;

      this.$categories.on('click', 'a', function(e){
        e.preventDefault();
        _this.showSubcategories($(this).closest('li'));
      });

      this.$sortAlphabetical.on('click', 'a', function(e){
        e.preventDefault();
        _this.sort('alphabetical');
        _this.$sortList.find('> li').removeClass('selected');
        $(this).parent().addClass('selected');
      });

      this.$sortPopular.on('click', 'a', function(e){
        e.preventDefault();
        _this.sort('popular');
        _this.$sortList.find('> li').removeClass('selected');
        $(this).parent().addClass('selected');
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
      this.sort();
    },

    updateUrl: function($category){
      var segment = $category.data('name');
      window.history.pushState({}, '', baseUrl.clone().segment(segment).get());
    },

    retrieveCategorySegment: function(){
      return $x.url(true).segment(baseUrlSegmentsLength);
    },

    deepLink: function(){
      var categorySegment = this.retrieveCategorySegment();
      if(categorySegment){
        this.$categories.removeClass('selected');
        var $currentCategory = this.$categories.filter('[data-name="'+categorySegment+'"]');
        $currentCategory.addClass('selected');
        this.showSubcategories($currentCategory);
      }
    },

    /** sorts the categories AND subcategories alphabetically or by popularity depending on type param
     * @param {String} type Type of sort [alphabetical/popular]
     */
    sort: function(type){
      var categories = this.$categories.toArray();
      var subcategories = this.$subcategoriesContainer.find('.subcategories > li').toArray();

      if(!type){
        type = this.$sortList.find('.selected').data('sort-type');
      }

      if(type==='alphabetical'){
        categories.sort(this.helpers.alphabeticalComparator);
        subcategories.sort(this.helpers.alphabeticalComparator);
      }
      else if(type==='popular'){
        categories.sort(this.helpers.popularComparator);
        subcategories.sort(this.helpers.popularComparator);
      }

      this.$categoriesContainer.append(categories);
      this.$subcategoriesContainer.find('.subcategories').append(subcategories);
    },

    helpers: {
      alphabeticalComparator: function(a, b){
        var label1 = $(a).data('name');
        var label2 = $(b).data('name');
        return (label1 < label2) ? -1 : (label1 > label2) ? 1 : 0;
      },
      popularComparator: function(a, b){
        var label1 = $(a).data('popularity-order');
        var label2 = $(b).data('popularity-order');
        return (label1 < label2) ? -1 : (label1 > label2) ? 1 : 0;
      }
    }
  };

  App.GuidanceAndSupport2 = GuidanceAndSupport2;
});
