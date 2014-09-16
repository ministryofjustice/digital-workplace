<!DOCTYPE html>
<html class="<?=$top_class?>">
<head>
  <?php $this->load->view('v'.version().'/modules/head'); ?>
</head>
<body>
  <div class="main-container">
    <div class="main-container-inner">
      <?php $this->load->view('v'.version().'/modules/header'); ?>
      <?php $this->load->view('v'.version().'/content/'.$page); ?>
      <?php $this->load->view('v'.version().'/modules/footer'); ?>
    </div>
  </div>
</body>
</html>
