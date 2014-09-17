<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class News_and_features extends CI_Controller {
	public function index() {
    $data = [
      'page'=>'news_and_features/main',
      'top_class'=>'content-news-and-features'
    ];

		$this->load->view('v'.version().'/layouts/default', $data);
	}
}
