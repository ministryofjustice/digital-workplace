<!DOCTYPE html>
<html>
<head>
  <?php $this->load->view('v1/modules/head'); ?>
</head>
<body>
  <div class="main-container">
    <div class="main-container-inner">
      <?php $this->load->view('v1/modules/header'); ?>
      <?php $this->load->view('v1/content/'.$page); ?>
      <?php $this->load->view('v1/modules/footer'); ?>
    </div>
  </div>
</body>
</html>
