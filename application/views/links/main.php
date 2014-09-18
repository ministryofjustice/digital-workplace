<? foreach($links as $category_name=>$items): ?>
  <h2><?=$category_name?></h2>
  <ul>
    <? foreach($items as $item_name=>$link): ?>
      <li><a href="<?=$link?>"><?=$item_name?></a></li>
    <? endforeach ?>
  </ul>
<? endforeach ?>
