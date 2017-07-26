// 创建全局对象
var Demo = {};

// 封装工具函数
// ajax方法
Demo.Ajax = function(url, method, param, callback, async) {
	// 创建XMLHttpRequest对象
	var xhr = new XMLHttpRequest();
	// 设置检测请求状态事件
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
				// 获取数据成功，执行回调函数
				callback(xhr.responseText);
			} else {
				alert('请求失败！错误代号：' + xhr.status);
			}
		}
	};
	switch (method) {
		case 'get':
			// 向url末尾添加查询字符串
			url += (url.indexOf('?') == -1 ? '?' : '&');
			url += serialize(param);
			xhr.open('get', url, async);
			xhr.send(null);
			break;
		case 'post':
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhr.open('post', url, async);
			xhr.send(serialize(param));
			break;
	}
	// 参数序列化方法
	function serialize(param) {
		var parts = [],
			value = '';
		for (var name in param) {
			if (!param.hasOwnProperty(name))
				continue;
			if (typeof param[name] == 'function')
				continue;
			name = encodeURIComponent(name);
			value = encodeURIComponent(param[name].toString());
			parts.push(name + '=' + value);
		}
		return parts.join('&');
	}
}

// cookie方法
Demo.CookieUtil = {
	// 获取名称为name的cookie的value值
	get: function(name) {
		// 将name编码并找出起始位置
		var cookieName = encodeURIComponent(name) + '=',
			cookieStart = document.cookie.indexOf(cookieName),
			cookieValue = null;
		if (cookieStart > -1) {
			// 找出键值对结束位置
			var cookieEnd = document.cookie.indexOf(';', cookieStart);
			if (cookieEnd == -1) {
				cookieEnd = document.cookie.length;
			}
			// 截取value值并解码
			cookieValue = decodeURIComponent(document.cookie.substring(cookieStart + cookieName.length, cookieEnd));
		}
		return cookieValue;
	},
	// 设置cookie
	set: function(name, value, days, path, domain, secure) {
		// name和value是必需的
		var cookieText = encodeURIComponent(name) + '=' + encodeURIComponent(value);
		// 失效时间
		if (days) {
			// 创建现在时间
			var date = new Date();
			// 创建失效时间
			date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
			cookieText += '; expires=' + date.toGMTString();
		}
		// 路径
		if (path) {
			cookieText += '; path=' + path;
		}
		// 域
		if (domain) {
			cookieText += '; domain=' + domain;
		}
		// 安全标志
		if (secure) {
			cookieText += '; secure';
		}
		document.cookie = cookieText;
	},
	// 删除cookie
	unset: function(name, path, domain, secure) {
		// 时间戳设置为以前时间cookie自动失效
		this.set(name, '', new Date(0), path, domain, secure);
	}
};

// 事件管理方法
Demo.EventUtil = {
	// 注册事件
	addHandler: function(element, type, handler) {
		if (element.addEventListener) {
			element.addEventListener(type, handler, false);
		} else if (element.attachEvent) {
			element.attachEvent('on' + type, handler);
		} else {
			element['on' + type] = handler;
		}
	},
	// 删除事件
	removeHandler: function(element, type, handler) {
		if (element.removeEventListener) {
			element.removeEventListener(type, handler, false);
		} else if (element.detachEvent) {
			element.detachEvent('on' + type, handler);
		} else {
			element['on' + type] = null;
		}
	},
	// 阻止默认操作
	preventDefault: function(event) {
		if (event.preventDefault) {
			event.preventDefault();
		} else {
			event.returnValue = false;
		};
	}
}

// 类名管理方法
Demo.ClassUtil = {
	// 判断是否有类名className
	hasClass: function(element, className) {
		var list = element.className.split(/\s+/);
		for (var i = 0; i < list.length; i++) {
			if (list[i] == className) {
				return true;
			}
		}
		return false;
	},
	// 增加类名className
	addClass: function(element, className) {
		var list = element.className.split(/\s+/);
		if (!list[0]) {
			element.className = className;
		} else {
			element.className += ' ' + className;
		}
	},
	// 删除类名className
	removeClass: function(element, className) {
		var list = element.className.split(/\s+/);
		if (!list[0]) return;
		for (var i = 0; i < list.length; i++) {
			if (list[i] == className) {
				list.splice(i, 1);
				element.className = list.join(' ');
			}
		}
	}
}

// 获取节点方法
Demo.$ = function(name) {
	return document.querySelector(name);
}

// 获取样式方法
Demo.getStyle = function(element, property) {
	// IE
	if (element.currentStyle) {
		return element.currentStyle[property];
		// DOM
	} else {
		return window.getComputedStyle(element, null)[property];
	}
}

// 各个模块功能实现
// 创建命名空间
Demo.Module = {};

// 通知条
Demo.Module.tips = (function() {
	var tips = Demo.$('.g-tips'),
		close = Demo.$('.g-tips .close');
	// 检查cookie,关闭通知条
	if (Demo.CookieUtil.get('tips')) {
		tips.style.display = 'none';
	} else {
		Demo.EventUtil.addHandler(close, 'click', function() {
			tips.style.display = 'none';
			Demo.CookieUtil.set('tips', 'close', 1);
		});
	}
})();

// 关注模块
Demo.Module.follow = (function() {
	var	follow = Demo.$('.m-follow .follow'),
		followsuc = Demo.$('.m-follow .followsuc'),
		cancel = Demo.$('.m-follow .cancel'),
		// 获取登录弹窗节点
		mask = Demo.$('.g-mask'),
		form = document.forms[0],
	    _userName = Demo.$('#username'),
		_password = Demo.$('#password'),
		close = Demo.$('.m-form .close');
	// 检查登录和关注cookie是否已设置
	if (Demo.CookieUtil.get('loginSuc') && Demo.CookieUtil.get('followSuc')) {
		// 调用已关注函数
		followed();
	} 
	// 添加关注按钮点击事件
	Demo.EventUtil.addHandler(follow, 'click', function() {
		// 检查登录cookie
		if (!Demo.CookieUtil.get('loginSuc')) {
			// 若未登录则弹出登录弹窗
			mask.style.display = 'block';
	        form.style.display = 'block';
		} else {
			// 若已登录则调用请求关注函数
			followRequest();
		};
	});
	// 添加取消关注事件
	Demo.EventUtil.addHandler(cancel, 'click', function() {
		followsuc.style.display = 'none';
		follow.style.display = 'block';
		Demo.CookieUtil.unset('followSuc');
	});
	// 设置关闭按钮
	Demo.EventUtil.addHandler(close, 'click', function() {
		mask.style.display = 'none';
		form.style.display = 'none';
	});
	// 登录表单验证、提交
	Demo.EventUtil.addHandler(form, 'submit', function(event) {
		event = event || window.event; 
		// 阻止默认操作
		Demo.EventUtil.preventDefault(event);
		// 验证表单
		if (!_userName.value && _password.value) {
			alert('请输入账号');
		}
		else if (!_password.value && _userName.value) {
			alert('请输入密码');
		}
		else if (!_password.value && !_userName.value) {
			alert('请输入账号和密码');
		} else {
			// 验证通过，提交表单
			Demo.Ajax(
				url = 'https://study.163.com/webDev/login.htm',
				method = 'get',
				param = {
					userName: md5(_userName.value),
					password: md5(_password.value)
				},
				callback = function(data) {
					if (data == 1) {
						// 登录成功，设置cookie
						Demo.CookieUtil.set('loginSuc', 'logged', 1);
						// 调用请求关注函数
				        followRequest();
				        // 关闭登录弹窗
				        mask.style.display = 'none';
				        form.style.display = 'none';
				        alert('登陆成功');
					} else {
						alert('账号或密码错误');
					}
				},
		        async = true
			);
		}
		
	});
	// 已关注函数
	function followed() {
		var follow = Demo.$('.m-follow .follow'),
			followsuc = Demo.$('.m-follow .followsuc');
		// 设置已关注样式
		follow.style.display = 'none';
		followsuc.style.display = 'block';
	}
	// 请求关注函数
	function followRequest() {
		// 调用Ajax请求关注
		Demo.Ajax(
			url = 'https://study.163.com/webDev/attention.htm',
			method = 'get',
			param = {},
			callback = function(data) {
				if (data == 1) {
					// 关注成功,调用已关注函数
					followed();
					Demo.CookieUtil.set('followSuc', 'followed', 1);
				} else {
					alert('关注失败！');
				}
			},
			async = true
		);
	}
})();

// 轮播图
Demo.Module.banner = (function() {
	var banner = Demo.$('.m-banner'),
	    imgList = document.querySelectorAll('.m-banner a'),
	    pointer = Demo.$('.m-banner .pointer'),
	    pointerList = document.querySelectorAll('.m-banner i'),
	    crtIndex = 0;
	// 刷新时显示第一张图片
	animation(imgList[crtIndex]);
	// 设置切换图片定时器
	var imgTimer = setTimeout(transImg, 4000);
	// 设置鼠标事件
	Demo.EventUtil.addHandler(banner, 'mouseover', function() {
		clearTimeout(imgTimer);
	});
	Demo.EventUtil.addHandler(banner, 'mouseout', function() {
		imgTimer = setTimeout(transImg, 4000);
	});
	// 设置点击事件代理
	Demo.EventUtil.addHandler(pointer, 'click', function(event) {
		event = event || window.event;
		// 获取事件目标和目标的索引值
		var target = event.target || event.srcElement,
		    index = parseInt(target.className);
		// 切换到点击按钮对应的图片
		if (index != crtIndex && !isNaN(index)) {
			// 退出当前图片
			Demo.ClassUtil.removeClass(imgList[crtIndex], 'z-show');
			imgList[crtIndex].style.filter = 'alpha(opacity:0)';// 兼容IE8
			imgList[crtIndex].style.opacity = 0;
			Demo.ClassUtil.removeClass(pointerList[crtIndex], 'z-crt');
			// 进入点击按钮对应的图片
			Demo.ClassUtil.addClass(imgList[index], 'z-show');
			Demo.ClassUtil.addClass(pointerList[index], 'z-crt');
			animation(imgList[index]);
			crtIndex = index;
		};
	});
	// 切换图片函数
	function transImg() {
		// 退出当前图片
		Demo.ClassUtil.removeClass(imgList[crtIndex], 'z-show');
		imgList[crtIndex].style.filter = 'alpha(opacity:0)';// 兼容IE8
		imgList[crtIndex].style.opacity = 0;
		Demo.ClassUtil.removeClass(pointerList[crtIndex], 'z-crt');
		// 若已到最后一张，则索引值归零
		if (crtIndex >= imgList.length - 1) {
			crtIndex = 0;
		} else{
			crtIndex++;
		};
		// 进入下一张图片
		Demo.ClassUtil.addClass(imgList[crtIndex], 'z-show');
		Demo.ClassUtil.addClass(pointerList[crtIndex], 'z-crt');
		animation(imgList[crtIndex]);
		// 设置下一个定时器
		imgTimer = setTimeout(transImg, 4000); 
	}
	// 渐入动画函数
	function animation(element) {
		var aniTimer = setTimeout(move, 20);
		function move() {
			var time = 500,
				step = 20,
				speed = 1 / time,
				stepLength = step * speed;
			if (Demo.getStyle(element, 'opacity') >= 1) {// IE8可以设置opacity属性，只是无效，可以用来作为检测
				element.style.filter = 'alpha(opacity:100)';// 兼容IE8
				element.style.opacity = 1;
			} else {
				element.style.filter = 'alpha(opacity:' + 100*(Number(Demo.getStyle(element, 'opacity')) + stepLength) + ')';// 兼容IE8
				element.style.opacity = Number(Demo.getStyle(element, 'opacity')) + stepLength;
				aniTimer = setTimeout(move, 20);
			};
		}
	}
})();

// 图片墙滚动
Demo.Module.imgWrap = (function() {
	var wrap = Demo.$('.m-imgwrap .wrap'),
	    speed = 1;
	// 设置图片滚动定时器
	var timer = setTimeout(moveImg, 15);
	// 设置鼠标事件
	Demo.EventUtil.addHandler(wrap, 'mouseover', function() {
		clearTimeout(timer);
	});
	Demo.EventUtil.addHandler(wrap, 'mouseout', function() {
		timer = setTimeout(moveImg, 15);
	});
	// 图片滚动函数
	function moveImg() {
		if (wrap.offsetLeft <= -1616) {
			wrap.style.left = 0;
		} else{
			wrap.style.left = wrap.offsetLeft - speed + 'px';
		}; 
		timer = setTimeout(moveImg, 15);
	}
})();

// 主栏课程模块
Demo.Module.course = (function() {
	var crtPage = 1,
	    crtSize = 20,
	    crtType = 10,
	    lastPage,
	    tab = Demo.$('.m-tab .tt'),
	    tabList = document.querySelectorAll('.m-tab .tt h3'),
	    course = Demo.$('.m-tab .ct .list'),
	    page = Demo.$('.m-tab .page .wrap'),
	    pageList;
	// 根据打开页面时屏幕宽度设置请求数据个数
	if (document.body.clientWidth < 1205) {
		crtSize = 15;	
	} 	
	// 默认加载产品设计第一页
	setContent(1, crtSize, 10);
    // 点击标签切换内容
    Demo.EventUtil.addHandler(tab, 'click', function(event) {
    	event = event || window.event;
    	var target = event.target || event.srcElement,
    	    type = parseInt(target.className);
    	// 如果点击标签不是当前停留标签再跳转
    	if (type != crtType) {
    		// 修改标签样式
    		Demo.ClassUtil.removeClass(tabList[crtType/10 - 1], 'z-sel');
			Demo.ClassUtil.addClass(tabList[type/10 - 1], 'z-sel');
			// 刷新内容
			course.innerHTML = '';
			setContent(1, crtSize, type);
			crtPage = 1;
			crtType = type;
    	};
    })
    // 点击翻页器切换内容
    Demo.EventUtil.addHandler(page, 'click', function(event) {
    	event = event || window.event;
    	var target = event.target || event.srcElement,
    	    index = parseInt(target.className),
    	    pre = Demo.$('.m-tab .page .pre'),
    	    next = Demo.$('.m-tab .page .next');
    	// 如果点击标签不是当前停留标签再跳转
    	switch (target.className) {
    		// 上一页
    		case 'pre':
    			if (crtPage > 1) {
					// 修改页码样式
					Demo.ClassUtil.removeClass(pageList[crtPage - 1], 'z-sel');
					Demo.ClassUtil.addClass(pageList[crtPage - 2], 'z-sel');
					// 刷新课程内容
					crtPage -= 1;
					course.innerHTML = '';
					setCourse(crtPage, crtSize, crtType);
				}
				break;
			// 下一页
    		case 'next':
    			if (crtPage < lastPage) {
					// 修改页码样式
					Demo.ClassUtil.removeClass(pageList[crtPage - 1], 'z-sel');
					Demo.ClassUtil.addClass(pageList[crtPage], 'z-sel');
					// 刷新课程内容
					crtPage += 1;
					course.innerHTML = '';
					setCourse(crtPage, crtSize, crtType);
				}
				break;
			// 点击页码
    		default:
    			if (crtPage - 1 != index) {
					// 修改页码样式
					Demo.ClassUtil.removeClass(pageList[crtPage - 1], 'z-sel');
					Demo.ClassUtil.addClass(pageList[index], 'z-sel');
					// 刷新课程内容
					crtPage = index + 1;
					course.innerHTML = '';
					setCourse(crtPage, crtSize, crtType);
				}
				break;
    	}
    })
    // 加载课程和页码函数
    function setContent(_pageNo, _psize, _type) {
		Demo.Ajax(
			url = 'https://study.163.com/webDev/couresByCategory.htm',
			method = 'get',
			param = {
				pageNo: _pageNo,
				psize: _psize,
				type: _type
			},
			callback = function(data) {
				showCourse(data);
				showPage(data);
			},
			async = true
		);
    }
    // 加载课程函数
    function setCourse(_pageNo, _psize, _type) {
		Demo.Ajax(
			url = 'https://study.163.com/webDev/couresByCategory.htm',
			method = 'get',
			param = {
				pageNo: _pageNo,
				psize: _psize,
				type: _type
			},
			callback = showCourse,
			async = true
		);
    }
    // 显示课程函数
    function showCourse(data) {
    	var list = JSON.parse(data).list,
			template = '';
		for (var i = list.length - 1; i >= 0; i--) {
			template += setTemplate(i);
		};
		course.innerHTML = template;
		// 创建模板函数
		function setTemplate(index) {
			return '<li><img src="' + list[index].middlePhotoUrl
			        + '" alt="课程图片"><h3 class="f-ellipsis">'
					+ list[index].name + '</h3><p>' + list[index].provider
					+ '</p><div class="u-num">' + list[index].learnerCount
					+ '</div><div class="cost">&yen; ' + list[index].price.toFixed(2)
					+ '</div><div class="pop"><div class="info f-cb"><img src="'
				    + list[index].middlePhotoUrl + '" alt="课程图片"><h3>'
					+ list[index].name + '</h3><div class="u-num">' + list[index].learnerCount
					+ ' 人在学</div><p class="author">发布者：' + list[index].provider
					+ '</p><p>分类：' + list[index].categoryName + '</p></div><p class="intr">'
					+ list[index].description + '</p></div></li>';
		}
    }
    // 显示页码函数
	function showPage(data) {
		var totalPage = JSON.parse(data).totalPage,
			template = '<span class="pre"></span>';
		for (var i = 0; i < totalPage; i++) {
			template += '<i class="' + i + '">' + (i + 1) + '</i>';
		};
		template += '<span class="next"></span>';
		page.innerHTML = template;
		lastPage = totalPage;
		pageList = document.querySelectorAll('.m-tab .page i');
		// 默认选中页码为1
		Demo.ClassUtil.addClass(pageList[0], 'z-sel');
	}
})();

// 视频弹窗
Demo.Module.video = (function() {
	var videoImg = Demo.$('.m-intr img'),
		mask = Demo.$('.g-mask'),
		wrap = Demo.$('.m-video'),
		video = Demo.$('.m-video .video'),
		close = Demo.$('.m-video .close');
	// 点击图片弹出视频
	Demo.EventUtil.addHandler(videoImg,'click',function() {
		mask.style.display = 'block';
		wrap.style.display = 'block';
	});
	// 点击关闭停止播放
	Demo.EventUtil.addHandler(close,'click',function() {
		mask.style.display = 'none';
		wrap.style.display = 'none';
		video.pause();
	});
})();

// 侧栏热门课程
Demo.Module.hotCourse = (function() {
	var course = Demo.$('.m-hotlist .list');	
	// 默认加载前十门课程，5s更新一门
	Demo.Ajax(
		url = 'https://study.163.com/webDev/hotcouresByCategory.htm',
		method = 'get',
		param = {},
		callback = showCourse,
		async = true
	);
    // 显示课程函数
    function showCourse(data) {
    	var list = JSON.parse(data),
    	    index = 0,
			template = '',
			courseList;
		// 加载前十门课程
		do {
			template += setTemplate(index);
			index++;
		} while (index <= 9);
		course.innerHTML = template;
		// 设置课程滚动定时器
		var courseTimer = setTimeout(function() {
			if (index >= 19) {
				index = 0;
			} else{
				// 删除第一个子节点
				course.removeChild(course.firstChild);
				// 创建更新节点
				var node = document.createElement('li');
				Demo.ClassUtil.addClass(node, 'f-cb');
				node.innerHTML = '<img src="' + list[index].smallPhotoUrl
			        + '" alt="课程图片"><p class="f-ellipsis">'
					+ list[index].name + '</p><div class="u-num">'
					+ list[index].learnerCount + '</div>';
			    // 添加节点
				course.appendChild(node);
				index++;
				courseTimer = setTimeout(arguments.callee, 5000);
			};
		}, 5000);
		// 创建模板函数
		function setTemplate(index) {
			return '<li class="f-cb"><img src="' + list[index].smallPhotoUrl
			        + '" alt="课程图片"><p class="f-ellipsis">'
					+ list[index].name + '</p><div class="u-num">'
					+ list[index].learnerCount + '</div></li>';
		}
    }
})();
