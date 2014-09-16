<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Version extends CI_Controller {
	public function set($v = null) {
    if ($v) {
      $_SESSION['v'] = $v;
      $this->session->set_userdata('version', $v);
      redirect('homepage');
    }
	}
}
