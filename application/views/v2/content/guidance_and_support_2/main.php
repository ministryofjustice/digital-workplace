<div class="content">
  <div class="grid grid-pad">
    <ul class="sort">
      <li class="popular">
        <a href="">
          <span class="icon"></span>
          <span class="label">popular order</span>
        </a>
      </li>
      <li class="alphabetical">
        <a href="">
          <span class="icon"></span>
          <span class="label">alphabetical order</span>
        </a>
      </li>
    </ul>
  </div>

  <div class="grid grid-pad">
    <div class="col-1-3">
      <ul class="categories">
        <?$cat_counter = 1?>
        <?foreach($list as $category_name=>$category):?>
          <?
            $category_name_computerized = strtolower($category_name);
            $category_name_computerized = str_replace(' ', '_', $category_name_computerized);
            $category_name_computerized = str_replace('&amp;', 'and', $category_name_computerized);
            $category_name_computerized = preg_replace('/[^A-Za-z_-]/', '', $category_name_computerized);
          ?>
          <li data-order="<?=$cat_counter;$cat_counter++?>" data-category-name="<?=$category_name_computerized?>">
            <a href=""><?=$category_name?></a>
            <ul class="subcategories">
              <?$sub_counter = 1?>
              <?foreach($category['items'] as $subcategory_name=>$subcategory):?>
                <li data-order="<?=$sub_counter;$sub_counter++?>">
                  <a href="">
                    <span class="subcategory-name"><?=$subcategory_name?></span>
                    <p><?=$subcategory['desc']?></p>
                  </a>
                  <ul class="links">
                    <!-- to be implemented -->
                  </ul>
                </li>
              <?endforeach?>
            </ul>
          </li>
        <?endforeach?>
      </ul>
    </div>
    <div class="subcategories-container col-1-3">
      <h2 class="category-label"></h2>
    </div>
    <div class="links-container col-1-3">
    </div>
  </div>
</div>
