<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Guidance_and_support_model extends CI_Model {
  public function __construct(){
    parent::__construct();

    $this->list = [
      'HR'=>[
        'items'=>[
          'Contact us'=>[
            'desc'=>'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nam nibh.'
          ],
          'Induction'=>[
            'desc'=>'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nam nibh.'
          ],
          'Leave'=>[
            'desc'=>'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nam nibh.'
          ],
          'Sick absence'=>[
            'desc'=>'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nam nibh.'
          ],
          'Performance management'=>[
            'desc'=>'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nam nibh.'
          ],
        ]
      ],
      'Building &amp; Facilities'=>[
        'items'=>[
        ]
      ],
      'Financial Management'=>[
        'items'=>[
        ]
      ],
      'Security'=>[
        'items'=>[
        ]
      ],
      'IT Services'=>[
        'items'=>[
        ]
      ],
      'Fire, Health &amp; Safety'=>[
        'items'=>[
        ]
      ],
      'Contract Management'=>[
        'items'=>[
        ]
      ],
      'Communications'=>[
        'items'=>[
        ]
      ],
      'Knowledge &amp; Information'=>[
        'items'=>[
        ]
      ],
      'Change Management'=>[
        'items'=>[
        ]
      ],
      'Charities &amp; Volunteering'=>[
        'items'=>[
        ]
      ],
      'Devolution'=>[
        'items'=>[
        ]
      ],
      'Equality &amp; Diversity'=>[
        'items'=>[
        ]
      ],
      'Internal Audit'=>[
        'items'=>[
        ]
      ],
      'Legal'=>[
        'items'=>[
        ]
      ],
    ];
  }

  public function get_list(){
    return $this->list;
  }
}
