
/*
  封装自动生成select框的插件
  level: @int 2|3 地址的等级 市/区
  filed: @array 省/市/县 的后台字段名
*/

(function ($) {
  $.fn.selectAddr = function (opts){
    var defOpt = {
      addressLevel: ['选择省','选择市','选择区'],
      level: 3,
      url: ['/api/area/getProvince.html','/api/area/getCityByProvince.html','/api/area/getDistrictByCity.html'],
      onSelected: function (val,changeEle){  //val： 隐藏域的值 changeEle： 触发事件的select

      }
    };

    //初始化变量
    var opt = $.extend(defOpt,opts);
    opt.level -= 0;
    var $this = $(this),
        defCity = '<option value="">' + opt.addressLevel[1] + '</option>',
        defDistrict = '<option value="">' + opt.addressLevel[2] + '</option>',
        defStree = '<option value="">' + opt.addressLevel[3] + '</option>';

    var selectedVal = $this.val();
    if(selectedVal){
      var selectedProvince = compleAdd(selectedVal.substring(0,2)),
          selectedCity = compleAdd(selectedVal.substring(0,4)),
          selectedDistrict = compleAdd(selectedVal.substring(0,6));
    }

    //处理地址
    function compleAdd(str){
      var arr = [];
      for(var i=0;i<6;i++){
        if(str[i]){
          arr.push(str[i]);
        }else{
          arr.push(0);
        }
      }
      return arr.join('');
    }

    //添加select标签
    var html = '';
    for(var i=0;i<opt.level;i++){
      var cls = "addr-select";
      if(opt.class){
        cls = cls + " " + opt.class;
      }
      html += '<select class="' + cls + '"><option value="">'+ opt.addressLevel[i] +'</option></select>';
    }
    $this.after(html);

    var $select = $this.siblings('.addr-select'),
        $province = $select.first(),
        $city = $select.eq(1).attr('disabled',true),
        $district = $select.eq(2).attr('disabled',true),
        $stree = $select.eq(3).attr('disabled',true);

    //获取省份信息
    post(opt.url[0],{},function (res){
      var html = '';
      for(var i = 0; i < res.length; i++){
        html += '<option value="'+res[i]['id']+'">'+res[i]['cname']+'</option>';
      }
      $province.append(html);
      if(selectedProvince){
        $province.val(selectedProvince).trigger('change');
        selectedProvince = '';
      }
    });

    //添加省份change监听
    $province.on('change',function (){
      $this.val($province.val());
      if(!$(this).val()){
        $city.empty().append(defCity).attr('disabled',true);
        $district.empty().append(defDistrict).attr('disabled',true);
        $stree.empty().append(defStree).attr('disabled',true);
        $this.val($province.val());
        opt.onSelected($this.val(),$province);
        return false;
      }
      post(opt.url[1],{
        province_id: $(this).val()
      },function (res){
        var html = defCity;
        for(var i = 0; i < res.length; i++){
          html += '<option value="'+res[i]['id']+'">'+res[i]['cname1']+'</option>';
        }
        $city.empty().append(html).attr('disabled',false);
        $district.empty().append(defDistrict).attr('disabled',true);
        $stree.empty().append(defStree).attr('disabled',true);
        if(selectedCity){
          $city.val(selectedCity).trigger('change');
          selectedCity = '';
        }
        opt.onSelected($this.val(),$province);
      });
    });

    // 添加城市city监听
    $city.on('change',function (){
      if(!$(this).val()){
        $district.empty().append(defDistrict).attr('disabled',true);
        $stree.empty().append(defStree).attr('disabled',true);
        $this.val($province.val());
        opt.onSelected($this.val(),$city);
        return false;
      }else{
        $this.val($city.val());
        if (opt.level === 2) opt.onSelected($this.val(),$city);
      }

      if (opt.level > 2){
        post(opt.url[2],{
          city_id: $(this).val()
        },function (res){
          if(!res){
            $city.children().each(function (){
              if(this.value === $city.val()){
                res = [];
                res.push({id: this.value,cname: this.innerText});
              }
            });
          }
          var html = defDistrict;
          for(var i = 0; i < res.length; i++){
            html += '<option value="'+res[i]['id']+'">'+res[i]['cname']+'</option>';
          }
          $district.empty().append(html).attr('disabled',false);
          $stree.empty().append(defStree).attr('disabled',true);
          opt.onSelected($this.val(),$city);
          if(selectedDistrict){
            $district.val(selectedDistrict).trigger('change');
            selectedCity = '';
            selectedDistrict = '';
          }
        });
      }
    });

    //添加地区district监听
    if(opt.level === 3){
      $district.on('change',function (){
        if(!$(this).val()){
          $this.val($city.val());
          opt.onSelected($city.val(),$district);
          return false;
        }else{
          $this.val($district.val());
          opt.onSelected($district.val(),$district);
        }
      });
    }

    if(opt.level === 4){
      $district.on('change',function (){
        if(!$(this).val()){
          $stree.empty().append(defStree).attr('disabled',true);
          $this.val($city.val());
          opt.onSelected($this.val(),$district);
          return false;
        }else{
          $this.val($district.val());
          if (opt.level === 3) opt.onSelected($this.val(),$district);
        }

        if (opt.level === 4){
          post(opt.url[3],{
            district_id: $(this).val()
          },function (res){
            if(!res){
              $district.children().each(function (){
                if(this.value === $district.val()){
                  res = [];
                  res.push({id: this.value,cname: this.innerText});
                }
              });
            }
            var html = defStree;
            for(var i = 0; i < res.length; i++){
              html += '<option value="'+res[i]['id']+'">'+res[i]['cname']+'</option>';
            }
            $stree.empty().append(html).attr('disabled',false);
            opt.onSelected($this.val(),$district);
            if(selectedVal){
              $stree.val(selectedVal).trigger('change');
              selectedCity = '';
              selectedVal = '';
            }
          });
        }
      });

      $stree.on('change',function (){
        if(!$(this).val()){
          $this.val($district.val());
          opt.onSelected($district.val(),$stree);
          return false;
        }else{
          $this.val($stree.val());
          opt.onSelected($stree.val(),$stree);
        }
      });
    }


    //ajax获取数据
    function post(u,d,fnSuccess){
      $.ajax({
        url: u,
        data: d,
        type: 'get',
        success: function(data) {
          fnSuccess(data);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
        },
      });
    }

    return $this;
  }
})(jQuery);
