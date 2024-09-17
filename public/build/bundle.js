
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const user = writable({
      name: 'Harshini',
      daysActive: 1,
      startDate: new Date().toLocaleDateString()
    });

    /* src/components/Header.svelte generated by Svelte v3.59.2 */
    const file$3 = "src/components/Header.svelte";

    function create_fragment$5(ctx) {
    	let header;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let div;
    	let p1;
    	let t4;
    	let t5_value = /*$user*/ ctx[0].name + "";
    	let t5;
    	let t6;
    	let p2;
    	let t9;
    	let p3;
    	let t10;
    	let t11_value = /*$user*/ ctx[0].daysActive + "";
    	let t11;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Kokoro";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Nurture Your Heart, Mind & Spirit";
    			t3 = space();
    			div = element("div");
    			p1 = element("p");
    			t4 = text("Welcome, ");
    			t5 = text(t5_value);
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = `Today: ${/*currentDate*/ ctx[1]}`;
    			t9 = space();
    			p3 = element("p");
    			t10 = text("Days of growth: ");
    			t11 = text(t11_value);
    			attr_dev(h1, "class", "svelte-11jkfhr");
    			add_location(h1, file$3, 6, 4, 145);
    			attr_dev(p0, "class", "tagline svelte-11jkfhr");
    			add_location(p0, file$3, 7, 4, 165);
    			attr_dev(p1, "class", "svelte-11jkfhr");
    			add_location(p1, file$3, 9, 6, 256);
    			attr_dev(p2, "class", "svelte-11jkfhr");
    			add_location(p2, file$3, 10, 6, 291);
    			attr_dev(p3, "class", "svelte-11jkfhr");
    			add_location(p3, file$3, 11, 6, 325);
    			attr_dev(div, "class", "user-info svelte-11jkfhr");
    			add_location(div, file$3, 8, 4, 226);
    			attr_dev(header, "class", "svelte-11jkfhr");
    			add_location(header, file$3, 5, 2, 132);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(header, t1);
    			append_dev(header, p0);
    			append_dev(header, t3);
    			append_dev(header, div);
    			append_dev(div, p1);
    			append_dev(p1, t4);
    			append_dev(p1, t5);
    			append_dev(div, t6);
    			append_dev(div, p2);
    			append_dev(div, t9);
    			append_dev(div, p3);
    			append_dev(p3, t10);
    			append_dev(p3, t11);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$user*/ 1 && t5_value !== (t5_value = /*$user*/ ctx[0].name + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*$user*/ 1 && t11_value !== (t11_value = /*$user*/ ctx[0].daysActive + "")) set_data_dev(t11, t11_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $user;
    	validate_store(user, 'user');
    	component_subscribe($$self, user, $$value => $$invalidate(0, $user = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	let currentDate = new Date().toLocaleDateString();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ user, currentDate, $user });

    	$$self.$inject_state = $$props => {
    		if ('currentDate' in $$props) $$invalidate(1, currentDate = $$props.currentDate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$user, currentDate];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/MoodTracker.svelte generated by Svelte v3.59.2 */

    const file$2 = "src/components/MoodTracker.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (18:6) {#each moods as mood}
    function create_each_block$1(ctx) {
    	let button;
    	let t0_value = /*mood*/ ctx[5].emoji + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*mood*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "title", /*mood*/ ctx[5].description);
    			attr_dev(button, "class", "svelte-1c2eqbf");
    			toggle_class(button, "selected", /*selectedMood*/ ctx[0] === /*mood*/ ctx[5]);
    			add_location(button, file$2, 18, 8, 510);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*selectedMood, moods*/ 3) {
    				toggle_class(button, "selected", /*selectedMood*/ ctx[0] === /*mood*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(18:6) {#each moods as mood}",
    		ctx
    	});

    	return block;
    }

    // (28:4) {#if selectedMood}
    function create_if_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*moods*/ ctx[1].find(/*func*/ ctx[4]).description + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("I'm feeling ");
    			t1 = text(t1_value);
    			attr_dev(p, "class", "mood-description");
    			add_location(p, file$2, 28, 4, 757);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedMood*/ 1 && t1_value !== (t1_value = /*moods*/ ctx[1].find(/*func*/ ctx[4]).description + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(28:4) {#if selectedMood}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let h2;
    	let t1;
    	let div0;
    	let t2;
    	let each_value = /*moods*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let if_block = /*selectedMood*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "How You Doin'?";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(h2, "class", "svelte-1c2eqbf");
    			add_location(h2, file$2, 15, 4, 419);
    			attr_dev(div0, "class", "mood-options svelte-1c2eqbf");
    			add_location(div0, file$2, 16, 4, 447);
    			attr_dev(div1, "class", "mood-tracker svelte-1c2eqbf");
    			add_location(div1, file$2, 14, 2, 388);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			append_dev(div1, t2);
    			if (if_block) if_block.m(div1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*moods, selectedMood, selectMood*/ 7) {
    				each_value = /*moods*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*selectedMood*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MoodTracker', slots, []);
    	let selectedMood = '';

    	const moods = [
    		{ emoji: '😄', description: 'Fantastic!' },
    		{ emoji: '😊', description: 'Pretty Good' },
    		{ emoji: '😐', description: 'Neutral' },
    		{ emoji: '😕', description: 'A Bit Down' },
    		{
    			emoji: '😢',
    			description: 'Having a Hard Time'
    		}
    	];

    	function selectMood(mood) {
    		$$invalidate(0, selectedMood = mood);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MoodTracker> was created with unknown prop '${key}'`);
    	});

    	const click_handler = mood => selectMood(mood.emoji);
    	const func = m => m.emoji === selectedMood;
    	$$self.$capture_state = () => ({ selectedMood, moods, selectMood });

    	$$self.$inject_state = $$props => {
    		if ('selectedMood' in $$props) $$invalidate(0, selectedMood = $$props.selectedMood);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedMood, moods, selectMood, click_handler, func];
    }

    class MoodTracker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MoodTracker",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/GratitudeJournal.svelte generated by Svelte v3.59.2 */

    function create_fragment$3(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GratitudeJournal', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GratitudeJournal> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class GratitudeJournal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GratitudeJournal",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/SelfCareGoals.svelte generated by Svelte v3.59.2 */
    const file$1 = "src/components/SelfCareGoals.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[14] = i;
    	return child_ctx;
    }

    // (56:6) {#each goals as goal, index}
    function create_each_block(ctx) {
    	let li;
    	let input;
    	let input_checked_value;
    	let t0;
    	let span;
    	let t1_value = /*goal*/ ctx[12].text + "";
    	let t1;
    	let t2;
    	let button;
    	let t4;
    	let mounted;
    	let dispose;

    	function change_handler() {
    		return /*change_handler*/ ctx[9](/*index*/ ctx[14]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[10](/*index*/ ctx[14]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			button = element("button");
    			button.textContent = "×";
    			t4 = space();
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = /*goal*/ ctx[12].completed;
    			attr_dev(input, "class", "svelte-zpyygt");
    			add_location(input, file$1, 57, 10, 1500);
    			add_location(span, file$1, 62, 10, 1643);
    			attr_dev(button, "class", "remove-btn svelte-zpyygt");
    			add_location(button, file$1, 63, 10, 1678);
    			attr_dev(li, "class", "svelte-zpyygt");
    			toggle_class(li, "completed", /*goal*/ ctx[12].completed);
    			add_location(li, file$1, 56, 8, 1452);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, input);
    			append_dev(li, t0);
    			append_dev(li, span);
    			append_dev(span, t1);
    			append_dev(li, t2);
    			append_dev(li, button);
    			append_dev(li, t4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", change_handler, false, false, false, false),
    					listen_dev(button, "click", click_handler, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*goals*/ 1 && input_checked_value !== (input_checked_value = /*goal*/ ctx[12].completed)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*goals*/ 1 && t1_value !== (t1_value = /*goal*/ ctx[12].text + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*goals*/ 1) {
    				toggle_class(li, "completed", /*goal*/ ctx[12].completed);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(56:6) {#each goals as goal, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div3;
    	let h2;
    	let t1;
    	let div0;
    	let input;
    	let t2;
    	let button;
    	let t4;
    	let ul;
    	let t5;
    	let div2;
    	let div1;
    	let t6;
    	let p;
    	let t7;
    	let t8;
    	let t9_value = /*goals*/ ctx[0].length + "";
    	let t9;
    	let t10;
    	let mounted;
    	let dispose;
    	let each_value = /*goals*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Self-Care Goals";
    			t1 = space();
    			div0 = element("div");
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Add Goal";
    			t4 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t6 = space();
    			p = element("p");
    			t7 = text(/*completedGoals*/ ctx[1]);
    			t8 = text(" out of ");
    			t9 = text(t9_value);
    			t10 = text(" goals completed");
    			attr_dev(h2, "class", "svelte-zpyygt");
    			add_location(h2, file$1, 42, 4, 1076);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter a new self-care goal");
    			attr_dev(input, "class", "svelte-zpyygt");
    			add_location(input, file$1, 45, 6, 1139);
    			attr_dev(button, "class", "svelte-zpyygt");
    			add_location(button, file$1, 51, 6, 1323);
    			attr_dev(div0, "class", "add-goal svelte-zpyygt");
    			add_location(div0, file$1, 44, 4, 1110);
    			attr_dev(ul, "class", "goal-list svelte-zpyygt");
    			add_location(ul, file$1, 54, 4, 1386);
    			attr_dev(div1, "class", "progress svelte-zpyygt");
    			set_style(div1, "width", /*progress*/ ctx[3] + "%");
    			add_location(div1, file$1, 69, 6, 1829);
    			attr_dev(div2, "class", "progress-bar svelte-zpyygt");
    			add_location(div2, file$1, 68, 4, 1796);
    			attr_dev(p, "class", "progress-text svelte-zpyygt");
    			add_location(p, file$1, 71, 4, 1900);
    			attr_dev(div3, "class", "self-care-goals svelte-zpyygt");
    			add_location(div3, file$1, 41, 2, 1042);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h2);
    			append_dev(div3, t1);
    			append_dev(div3, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*newGoalText*/ ctx[2]);
    			append_dev(div0, t2);
    			append_dev(div0, button);
    			append_dev(div3, t4);
    			append_dev(div3, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}

    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div3, t6);
    			append_dev(div3, p);
    			append_dev(p, t7);
    			append_dev(p, t8);
    			append_dev(p, t9);
    			append_dev(p, t10);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(input, "keypress", /*keypress_handler*/ ctx[8], false, false, false, false),
    					listen_dev(button, "click", /*addGoal*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newGoalText*/ 4 && input.value !== /*newGoalText*/ ctx[2]) {
    				set_input_value(input, /*newGoalText*/ ctx[2]);
    			}

    			if (dirty & /*goals, removeGoal, toggleGoal*/ 97) {
    				each_value = /*goals*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*progress*/ 8) {
    				set_style(div1, "width", /*progress*/ ctx[3] + "%");
    			}

    			if (dirty & /*completedGoals*/ 2) set_data_dev(t7, /*completedGoals*/ ctx[1]);
    			if (dirty & /*goals*/ 1 && t9_value !== (t9_value = /*goals*/ ctx[0].length + "")) set_data_dev(t9, t9_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let completedGoals;
    	let progress;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SelfCareGoals', slots, []);
    	let goals = [];
    	let newGoalText = '';

    	onMount(() => {
    		// Load goals from local storage on component mount
    		const storedGoals = localStorage.getItem('selfCareGoals');

    		if (storedGoals) {
    			$$invalidate(0, goals = JSON.parse(storedGoals));
    		}
    	});

    	function addGoal() {
    		if (newGoalText.trim()) {
    			$$invalidate(0, goals = [...goals, { text: newGoalText, completed: false }]);
    			$$invalidate(2, newGoalText = '');
    			saveGoals();
    		}
    	}

    	function toggleGoal(index) {
    		$$invalidate(0, goals[index].completed = !goals[index].completed, goals);
    		$$invalidate(0, goals = [...goals]);
    		saveGoals();
    	}

    	function removeGoal(index) {
    		$$invalidate(0, goals = goals.filter((_, i) => i !== index));
    		saveGoals();
    	}

    	function saveGoals() {
    		localStorage.setItem('selfCareGoals', JSON.stringify(goals));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SelfCareGoals> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		newGoalText = this.value;
    		$$invalidate(2, newGoalText);
    	}

    	const keypress_handler = e => e.key === 'Enter' && addGoal();
    	const change_handler = index => toggleGoal(index);
    	const click_handler = index => removeGoal(index);

    	$$self.$capture_state = () => ({
    		onMount,
    		goals,
    		newGoalText,
    		addGoal,
    		toggleGoal,
    		removeGoal,
    		saveGoals,
    		completedGoals,
    		progress
    	});

    	$$self.$inject_state = $$props => {
    		if ('goals' in $$props) $$invalidate(0, goals = $$props.goals);
    		if ('newGoalText' in $$props) $$invalidate(2, newGoalText = $$props.newGoalText);
    		if ('completedGoals' in $$props) $$invalidate(1, completedGoals = $$props.completedGoals);
    		if ('progress' in $$props) $$invalidate(3, progress = $$props.progress);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*goals*/ 1) {
    			$$invalidate(1, completedGoals = goals.filter(goal => goal.completed).length);
    		}

    		if ($$self.$$.dirty & /*goals, completedGoals*/ 3) {
    			$$invalidate(3, progress = goals.length > 0
    			? completedGoals / goals.length * 100
    			: 0);
    		}
    	};

    	return [
    		goals,
    		completedGoals,
    		newGoalText,
    		progress,
    		addGoal,
    		toggleGoal,
    		removeGoal,
    		input_input_handler,
    		keypress_handler,
    		change_handler,
    		click_handler
    	];
    }

    class SelfCareGoals extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelfCareGoals",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/DailySummary.svelte generated by Svelte v3.59.2 */

    function create_fragment$1(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DailySummary', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DailySummary> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class DailySummary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DailySummary",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let div;
    	let moodtracker;
    	let t2;
    	let gratitudejournal;
    	let t3;
    	let selfcaregoals;
    	let t4;
    	let dailysummary;
    	let current;
    	header = new Header({ $$inline: true });
    	moodtracker = new MoodTracker({ $$inline: true });
    	gratitudejournal = new GratitudeJournal({ $$inline: true });
    	selfcaregoals = new SelfCareGoals({ $$inline: true });
    	dailysummary = new DailySummary({ $$inline: true });

    	const block = {
    		c: function create() {
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			div = element("div");
    			create_component(moodtracker.$$.fragment);
    			t2 = space();
    			create_component(gratitudejournal.$$.fragment);
    			t3 = space();
    			create_component(selfcaregoals.$$.fragment);
    			t4 = space();
    			create_component(dailysummary.$$.fragment);
    			document.title = "Kokoro | Nurture Your Heart, Mind & Spirit";
    			attr_dev(div, "class", "content svelte-1ofuhlu");
    			add_location(div, file, 15, 2, 491);
    			attr_dev(main, "class", "svelte-1ofuhlu");
    			add_location(main, file, 13, 0, 469);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, div);
    			mount_component(moodtracker, div, null);
    			append_dev(div, t2);
    			mount_component(gratitudejournal, div, null);
    			append_dev(div, t3);
    			mount_component(selfcaregoals, div, null);
    			append_dev(div, t4);
    			mount_component(dailysummary, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(moodtracker.$$.fragment, local);
    			transition_in(gratitudejournal.$$.fragment, local);
    			transition_in(selfcaregoals.$$.fragment, local);
    			transition_in(dailysummary.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(moodtracker.$$.fragment, local);
    			transition_out(gratitudejournal.$$.fragment, local);
    			transition_out(selfcaregoals.$$.fragment, local);
    			transition_out(dailysummary.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(moodtracker);
    			destroy_component(gratitudejournal);
    			destroy_component(selfcaregoals);
    			destroy_component(dailysummary);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		MoodTracker,
    		GratitudeJournal,
    		SelfCareGoals,
    		DailySummary,
    		user
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
