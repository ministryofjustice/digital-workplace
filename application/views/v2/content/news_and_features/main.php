<?php $this->load->view('v'.version().'/content/news_and_features/sub_header'); ?>

<div class="content">
  <div class="grid grid-pad">
    <ul class="breadcrumbs">
      <li>
        <a href="homepage?v=<?=version()?>">Home</a>
      </li>
      <li>
        <a href="news_and_features?v=<?=version()?>">News &amp; features</a>
      </li>
    </ul>
  </div>

  <div class="grid grid-pad">
    <div class="col-1-1">
      <h2 class="category-heading">News &amp; features</h2>
    </div>
  </div>

  <div class="tabs content-row grid grid-pad">
    <div class="col-1-3">
      <ul class="news-top-links">
        <li class="<?=$tab_name=='mojozine'? 'selected' : ''?>">
          <a href="news_and_features/mojozine/?v=<?=version()?>">
            <span>MoJozine</span>
          </a>
        </li>
        <li class="<?=$tab_name=='corporate_updates'? 'selected' : ''?>">
          <a href="news_and_features/corporate_updates/?v=<?=version()?>">
            <span>Corporate updates</span>
          </a>
        </li>
        <li class="<?=$tab_name=='calendar'? 'selected' : ''?>">
          <a href="news_and_features/calendar/?v=<?=version()?>">
            <span>Calendar</span>
          </a>
        </li>
      </ul>
    </div>
    <p class="col-2-3 news-description">
      Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nam nibh. Nunc varius facilisis eros. Sed erat. In in velit quis arcu ornare laoreet. Curabitur adipiscing luctus massa.
    </p>
  </div>


  <div class="tab-content">
    <?php $this->load->view('v'.version().'/content/news_and_features/tabs/'.$tab_name); ?>
  </div>
</div>
