/**
 * jquery-trait
 * 
 * developed on jquery-3.2.1.js
 */

(function ($, window, document) {
    'use strict';

    var config = {};
    var tick = 100;

    // shared functions
    function afterTransition($el, then) {
        //console.log('afterTransition', $el)
        if (hasModifierOf($el, 'immediate')) {
            window.setTimeout(function () {
                then.call($el.get(0));
            }, tick);
        } else {
            $el.on('transitionend.trait animationend.trait', function () {
                //console.log('afterTransition.listener')
                $el.off('transitionend.trait animationend.trait');
                then.call($el.get(0));
            });
        }
    }
    function hasModifierOf($el, what) {
        what = '.'+what;
        return ($el.data('trait') && $el.data('trait').indexOf(what) >= 0);
    }

    // core methods
    function showInternal() {
        //console.log('showInternal', this);
        var $el = this;
        $el.toggleClass('onshow onshow4a hidden');
        $el.trigger('trait:onshow');
        window.setTimeout(function () {
            //console.log('showInternal1', $el);
            if (hasModifierOf($el, 'width')) $el.css('width', $el.children().outerWidth(true));
            if (hasModifierOf($el, 'height')) $el.css('height', $el.children().outerHeight(true));
            $el.removeClass('onshow');
            afterTransition($el, function () {
                //console.log('showInternal2', $el);
                $el.removeClass('onshow4a');
                if (hasModifierOf($el, 'width')) $el.css('width', '');
                if (hasModifierOf($el, 'height')) $el.css('height', '');
                if (hasModifierOf($el, 'focus')) $el.focus();
                $el.trigger('trait:shown');
            });
        }, tick);
    }
    function hideInternal() {
        //console.log('hideInternal', this);
        var $el = this;
        if (hasModifierOf($el, 'width')) $el.css('width', $el.children().outerWidth(true));
        if (hasModifierOf($el, 'height')) $el.css('height', $el.children().outerHeight(true));
        window.setTimeout(function () {
            //console.log('hideInternal1', $el);
            $el.addClass('onhide');
            if (hasModifierOf($el, 'width')) $el.css('width', '');
            if (hasModifierOf($el, 'height')) $el.css('height', '');
            $el.trigger('trait:onhide');
            afterTransition($el, function () {
                console.log('hideInternal2', $el);
                $el.toggleClass('onhide hidden');
                $el.trigger('trait:hidden');
            });
        }, tick);
    }

    // define components
    var x = {
        modal: {
            stack: [], 
            findOverlay: function ($modal) {
                var overlay = $($modal.data('trait-overlay')).first();
                //console.log('modal.findOverlay', overlay);
                return overlay;
            }, 
            show: function () {
                //console.log('x.modal.show', this);
                var $el = this;
                if (x.modal.stack.indexOf($el.get(0)) >= 0) return;
                x.modal.stack.unshift($el.get(0));
                showInternal.call(x.modal.findOverlay($el));
                showInternal.call($el);
            }, 
            shownHandler: function () {
                //console.log('x.modal.shownHandler', this);
                var $el = $(this);
                x.modal.findOverlay($el).on('click.traitModal', function () {
                    //console.log('modal.overlay-click-handler');
                    $el.traitHide();
                    return false;
                });
            }, 
            hide: function () {
                var $el = this;
                if (!x.modal.stack.length || x.modal.stack[0] != $el.get(0)) return;
                x.modal.stack.shift();
                hideInternal.call($el);
                hideInternal.call(x.modal.findOverlay($el));
            }, 
            hiddenHandler: function () {
                var $el = $(this);
                x.modal.findOverlay($el).off('click.traitModal');
            }, 
            init: function () {
                $(document).on('keydown.traitModal', function (e) {
                    //console.log('modal.esc-key-handler');
                    if (x.modal.stack.length && e.which == 27) {
                        $(x.modal.stack[0]).traitHide();
                        return false;
                    } else {
                        return true;
                    }
                });
                $(document).on('click.traitModal', '[data-trait^="modal"]', function (e) {
                    //console.log('modal.click-propagation-blocker');
                    e.stopPropagation();
                    return true;
                });
                $(document).on('trait:shown.traitModal', '[data-trait^="modal"]', x.modal.shownHandler);
                $(document).on('trait:hidden.traitModal', '[data-trait^="modal"]', x.modal.hiddenHandler);
            }
        },  // end of modal
        notice: {
            q: [], 
            show: function () {
                var $el = this;
                if (x.notice.q.indexOf($el.get(0)) >= 0) return;
                x.notice.q.push($el.get(0));
                if (x.notice.q.length == 1) {
                    showInternal.call($el);
                }
            }, 
            shownHandler:function () {
                var $el = $(this);
                //console.log('toast.shownHandler', this, config.noticeDuration);
                window.setTimeout(function () {
                    //console.log('toast.shownHandler1', $el);
                    x.notice.hide.call($el);
                }, config.noticeDuration);
            }, 
            hide: function () {
                var $el = this;
                if (!x.notice.q.length || x.notice.q[0] != $el.get(0)) return;
                x.notice.q.shift();
                hideInternal.call($el);
            }, 
            hiddenHandler: function () {
                window.setTimeout(function () {
                    if (x.notice.q.length) {
                        showInternal.call($(x.notice.q[0]));
                    }
                }, config.interval);
            }, 
            init: function () {
                $(document).on('trait:hidden.traitNotice', '[data-trait^="notice"]', x.notice.hiddenHandler);
                $(document).on('trait:shown.traitNotice', '[data-trait^="notice"]', x.notice.shownHandler);
            }
        },  // end of notice
        dropdown: {
            current: null, 
            show: function ($trigger) {
                //console.log('dropdown.show', this, $trigger);
                var $el = this;
                if (x.dropdown.current == this) return;
                if (x.dropdown.current) {
                    hideInternal.call($(x.dropdown.current));
                }
                x.dropdown.current = $el.get(0);
                x.dropdown.fitPosition(this, $trigger.get(0));
                showInternal.call($el);
            }, 
            fitPosition: function (dropdown, trigger) {
                var $t = $(trigger);
                var $d = $(dropdown);
                var $w = $(window);

                $d.css('visibility', 'hidden').removeClass('hidden');
                var tX = $t.offset().left - $w.scrollLeft();
                var tY = $t.offset().top - $w.scrollTop();
                var tWidth = $t.outerWidth();
                var tHeight = $t.outerHeight();
                var wWidth = $w.width();
                var wHeight = $w.height();
                var dWidth = $d.children().outerWidth();
                var dHeight = $d.children().outerHeight();
                $d.css('visibility', '').addClass('hidden');
                
                if (tX + dWidth <= wWidth) {
                    $(dropdown).css('left', tX + $w.scrollLeft());  // align left
                } else if (tX + tWidth - dWidth >= 0) {
                    $(dropdown).css('right', wWidth - (tX + tWidth));  // align right
                } else {
                    $(dropdown).css('left', $w.scrollLeft());  // align window left
                }
                if (tY + tHeight + dHeight <= wHeight) {
                    $(dropdown).css('top', $w.scrollTop() + tY + tHeight);  // under the trigger
                } else if (tY - dHeight >= 0) {
                    $(dropdown).css('bottom', $w.scrollTop() + wHeight - tY);  // on the trigger
                } else {
                    $(dropdown).css('top', $w.scrollTop());  // align window top
                }
            }, 
            hide: function () {
                //console.log('dropdown.hide', this);
                var $el = this;
                if (x.dropdown.current != $el.get(0)) return;
                x.dropdown.current = null;
                hideInternal.call($el);
            }, 
            hiddenHandler: function () {
                //console.log('dropdown.hiddenHandler', this);
                var $el = $(this);
                $el.css({left:'',right:'',top:'',bottom:''});
            }, 
            init: function () {
                $(document).on('trait:hidden.traitDropdown', '[data-trait^="dropdown"]', x.dropdown.hiddenHandler);
                $(document).on('keydown.traitDropdown', function (e) {
                    //console.log('dropdown.esc-key-handler');
                    if (x.dropdown.current && e.which == 27) {
                        $(x.dropdown.current).traitHide();
                        return false;
                    } else {
                        return true;
                    }
                });
                $(document).on('click.traitDropdown', '[data-trait^="dropdown"]', function (e) {
                    //console.log('dropdown.click-propagation-blocker');
                    e.stopPropagation();
                    return true;
                });
                $(document).on('click.traitDropdown', function (e) {
                    //console.log('dropdown.outer-click-handler');
                    if (x.dropdown.current) {
                        $(x.dropdown.current).traitHide();
                    }
                    return true;
                });
            }
        },  // end of dropdown
        expand: {
            show: function () {
                showInternal.call(this);
            }, 
            hide: function () {
                hideInternal.call(this);
            }
        },  // end of expand
        expandGroup: {
            findShown: function ($group) {
                var $found = $group.find('> '+config.itemSelector+':not(.hidden)').first();
                //console.log('expandGroup.findShown', $group, $found);
                return $found;
            }, 
            fillChildrenModifiers: function ($group) {
                var modifiers = $group.data('trait').replace(/expandGroup\./, 'x.');
                var $targets = $group.find('> '+config.itemSelector);
                $targets.each(function (i, e) {
                    //console.log('fill', e, modifiers);
                    if (!$(e).data('trait')) {
                        $(e).data('trait', modifiers);
                    }
                });
            }, 
            show: function ($target) {
                //console.log('expandGroup.show', this, $target);
                var $group = this;
                x.expandGroup.fillChildrenModifiers($group);
                if ($target.parent().get(0) != $group.get(0)) return;
                var $shown = x.expandGroup.findShown($group);
                if ($shown.length) {
                    //console.log('expandGroup.show.hide', $shown);
                    hideInternal.call($shown);
                    if (hasModifierOf($group, 'parallel')) {
                        showInternal.call($target);
                    } else {
                        $shown.on('trait:hidden.traitExpandGroup', function () {
                            //console.log('expandGroup.show.hidden')
                            $shown.off('trait:hidden.traitExpandGroup');
                            window.setTimeout(function() {
                                showInternal.call($target);
                            }, config.shortInterval);
                        });
                    }
                } else {
                    showInternal.call($target);
                }
            }, 
            hide: function ($target) {
                //console.log('expandGroup.hide', this, $target);
                if ($target.is('.hidden')) return;
                hideInternal.call($target);
            }
        }  // end of expandGroup
    }; // end of x

    // extend jquery
    $.trait = function (options) {
        config = $.extend({
            shortInterval: 50, 
            interval: 500, 
            noticeDuration:5000, 
            itemSelector: '*'
        }, options);
    };
    $.fn.traitShow = function () {
        var $el = this;
        x[$el.data('trait').split('.')[0]].show.apply($el, arguments);
        return $el;
    } 
    $.fn.traitHide = function () {
        var $el = this;
        x[$el.data('trait').split('.')[0]].hide.call($el, arguments);
        return $el;
    }

    // initialize components
    x.modal.init();
    x.notice.init();
    x.dropdown.init();

    // define connectors
    $(document).on('change', 'input[type="checkbox"][data-trait-connect]', function () {
        var $els = $($(this).data('trait-connect'));
        $els.each(function (i, el) {
            var $el = $(el);
            if ($el.is('.hidden')) x[$el.data('trait').split('.')[0]].show.call($el);
            else x[$el.data('trait').split('.')[0]].hide.call($el);
        })
    });
    $(document).on('change', 'select[data-trait-connect]', function () {
        var $target = $(this);
        var $els = $($target.data('trait-connect'));
        $els.each(function (i, el) {
            var $group = $(el);
            var selected = $group.find('> '+config.itemSelector)[$target.get(0).selectedIndex];
            x[$group.data('trait').split('.')[0]].show.call($group, $(selected));
        })
    });
    $(document).on('change', 'input[type="radio"][data-trait-connect]', function () {
        var $target = $(this);
        var $els = $($target.data('trait-connect'));
        $els.each(function (i, el) {
            var $radios = $('input[type="radio"][name="'+$target.attr('name')+'"]');
            var index = $radios.index($target.get(0));
            var $group = $(el);
            var selected = $group.find('> '+config.itemSelector)[index];
            x[$group.data('trait').split('.')[0]].show.call($group, $(selected));
        });
    })
    $(document).on('click', 'button[data-trait-connect], a[data-trait-connect], input[type="button"][data-trait-connect], input[type="submit"][data-trait-connect]', function () {
        var $target = $(this);
        var $els = $($target.data('trait-connect'));
        $els.each(function (i, el) {
            var $el = $(el);
            var cls = $el.data('trait').split('.')[0];
            if ($el.is('.hidden')) x[cls].show.call($el, $target);
            else x[cls].hide.call($el);
        });
        return false;
    });
})(jQuery, window, document);