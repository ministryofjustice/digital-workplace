/*!
 * Sizzle CSS Selector Engine
 * Copyright 2013 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://sizzlejs.com/
 */
(function( window, undefined ) {

var i,
	cachedruns,
	Expr,
	getText,
	isXML,
	compile,
	outermostContext,
	recompare,
	sortInput,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	support = {},
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	hasDuplicate = false,
	sortOrder = function() { return 0; },

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Array methods
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},


	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	operators = "([*^$|!~]?=)",
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

	// Prefer arguments quoted,
	//   then not containing pseudos/brackets,
	//   then attribute selectors/non-parenthetical expressions,
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*" ),
	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"NAME": new RegExp( "^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rsibling = /[\x20\t\r\n\f]*[+~]/,

	rnative = /^[^{]+\{\s*\[native code/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rescape = /'|\\/g,
	rattributeQuotes = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = /\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,
	funescape = function( _, escaped ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		return high !== high ?
			escaped :
			// BMP codepoint
			high < 0 ?
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

/**
 * For feature detection
 * @param {Function} fn The function to test for native support
 */
function isNative( fn ) {
	return rnative.test( fn + "" );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var cache,
		keys = [];

	return (cache = function( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key += " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key ] = value);
	});
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// release memory in IE
		div = null;
	}
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

	if ( documentIsHTML && !seed ) {

		// Shortcuts
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName && context.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && !rbuggyQSA.test(selector) ) {
			old = true;
			nid = expando;
			newContext = context;
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && context.parentNode || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Detect xml
 * @param {Element|Object} elem An element or a document
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var doc = node ? node.ownerDocument || node : preferredDoc;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsHTML = !isXML( doc );

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Check if attributes should be retrieved by attribute nodes
	support.attributes = assert(function( div ) {
		div.innerHTML = "<select></select>";
		var type = typeof div.lastChild.getAttribute("multiple");
		// IE8 returns a string for some attributes even when not present
		return type !== "boolean" && type !== "string";
	});

	// Check if getElementsByClassName can be trusted
	support.getElementsByClassName = assert(function( div ) {
		// Opera can't find a second classname (in 9.6)
		div.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>";
		if ( !div.getElementsByClassName || !div.getElementsByClassName("e").length ) {
			return false;
		}

		// Safari 3.2 caches class attributes and doesn't catch changes
		div.lastChild.className = "e";
		return div.getElementsByClassName("e").length === 2;
	});

	// Check if getElementsByName privileges form controls or returns elements by ID
	// If so, assume (for broader support) that getElementById returns elements by name
	support.getByName = assert(function( div ) {
		// Inject content
		div.id = expando + 0;
		// Support: Windows 8 Native Apps
		// Assigning innerHTML with "name" attributes throws uncatchable exceptions
		// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx
		div.appendChild( document.createElement("a") ).setAttribute( "name", expando );
		div.appendChild( document.createElement("i") ).setAttribute( "name", expando );
		docElem.appendChild( div );

		// Test
		var pass = doc.getElementsByName &&
			// buggy browsers will return fewer than the correct 2
			doc.getElementsByName( expando ).length === 2 +
			// buggy browsers will return more than the correct 0
			doc.getElementsByName( expando + 0 ).length;

		// Cleanup
		docElem.removeChild( div );

		return pass;
	});

	// Support: Webkit<537.32
	// Detached nodes confoundingly follow *each other*
	support.sortDetached = assert(function( div1 ) {
		return div1.compareDocumentPosition &&
			// Should return 1, but Webkit returns 4 (following)
			(div1.compareDocumentPosition( document.createElement("div") ) & 1);
	});

	// IE6/7 return modified attributes
	Expr.attrHandle = assert(function( div ) {
		div.innerHTML = "<a href='#'></a>";
		return div.firstChild && typeof div.firstChild.getAttribute !== strundefined &&
			div.firstChild.getAttribute("href") === "#";
	}) ?
		{} :
		{
			"href": function( elem ) {
				return elem.getAttribute( "href", 2 );
			},
			"type": function( elem ) {
				return elem.getAttribute("type");
			}
		};

	// ID find and filter
	if ( support.getByName ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
				var m = context.getElementById( id );

				return m ?
					m.id === id || typeof m.getAttributeNode !== strundefined && m.getAttributeNode("id").value === id ?
						[m] :
						undefined :
					[];
			}
		};
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== strundefined ) {
				return context.getElementsByTagName( tag );
			}
		} :
		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Name
	Expr.find["NAME"] = support.getByName && function( tag, context ) {
		if ( typeof context.getElementsByName !== strundefined ) {
			return context.getElementsByName( name );
		}
	};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== strundefined && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21),
	// no need to also add to buggyMatches since matches checks buggyQSA
	// A support test would require too much code (would include document ready)
	rbuggyQSA = [ ":focus" ];

	if ( (support.qsa = isNative(doc.querySelectorAll)) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select><option selected=''></option></select>";

			// IE8 - Some boolean attributes are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {

			// Opera 10-12/IE8 - ^= $= *= and empty values
			// Should not select anything
			div.innerHTML = "<input type='hidden' i=''/>";
			if ( div.querySelectorAll("[i^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:\"\"|'')" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = isNative( (matches = docElem.matchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.webkitMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = isNative(docElem.contains) || docElem.compareDocumentPosition ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	// Document order sorting
	sortOrder = docElem.compareDocumentPosition ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition( b );

		if ( compare ) {
			// Disconnected nodes
			if ( compare & 1 ||
				(recompare && b.compareDocumentPosition( a ) === compare) ) {

				// Choose the first element that is related to our preferred document
				if ( a === doc || contains(preferredDoc, a) ) {
					return -1;
				}
				if ( b === doc || contains(preferredDoc, b) ) {
					return 1;
				}

				// Maintain original order
				return sortInput ?
					( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
					0;
			}

			return compare & 4 ? -1 : 1;
		}

		// Not directly comparable, sort on existence of method
		return a.compareDocumentPosition ? -1 : 1;
	} :
	function( a, b ) {
		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// Parentless nodes are either documents or disconnected
		} else if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	// rbuggyQSA always contains :focus, so no need for an existence check
	if ( support.matchesSelector && documentIsHTML && (!rbuggyMatches || !rbuggyMatches.test(expr)) && !rbuggyQSA.test(expr) ) {
		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch(e) {}
	}

	return Sizzle( expr, document, null, [elem] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	var val;

	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	if ( documentIsHTML ) {
		name = name.toLowerCase();
	}
	if ( (val = Expr.attrHandle[ name ]) ) {
		return val( elem );
	}
	if ( !documentIsHTML || support.attributes ) {
		return elem.getAttribute( name );
	}
	return ( (val = elem.getAttributeNode( name )) || elem.getAttribute( name ) ) && elem[ name ] === true ?
		name :
		val && val.specified ? val.value : null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

// Document sorting and removing duplicates
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	// Compensate for sort limitations
	recompare = !support.sortDetached;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	return results;
};

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns Returns -1 if a precedes b, 1 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && ( ~b.sourceIndex || MAX_NEGATIVE ) - ( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

// Returns a function to use in pseudos for input types
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

// Returns a function to use in pseudos for buttons
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

// Returns a function to use in pseudos for positionals
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		for ( ; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (see #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[5] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[4] ) {
				match[2] = match[4];

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeName ) {
			if ( nodeName === "*" ) {
				return function() { return true; };
			}

			nodeName = nodeName.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
			};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( elem.className || (typeof elem.getAttribute !== strundefined && elem.getAttribute("class")) || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
			//   not comment, processing instructions, or others
			// Thanks to Diego Perini for the nodeName shortcut
			//   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeName > "@" || elem.nodeType === 3 || elem.nodeType === 4 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
			// use getAttribute instead to test this case
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === elem.type );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

function tokenize( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( tokens = [] );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push( {
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			} );
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push( {
					value: matched,
					type: type,
					matches: match
				} );
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
}

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var data, cache, outerCache,
				dirkey = dirruns + " " + doneName;

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (cache = outerCache[ dir ]) && cache[0] === dirkey ) {
							if ( (data = cache[1]) === true || data === cachedruns ) {
								return data === true;
							}
						} else {
							cache = outerCache[ dir ] = [ dirkey ];
							cache[1] = matcher( elem, context, xml ) || cachedruns;
							if ( cache[1] === true ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector( tokens.slice( 0, i - 1 ) ).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	// A counter to specify which element is currently being matched
	var matcherCachedRuns = 0,
		bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, expandContext ) {
			var elem, j, matcher,
				setMatched = [],
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				outermost = expandContext != null,
				contextBackup = outermostContext,
				// We must always have either seed elements or context
				elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1);

			if ( outermost ) {
				outermostContext = context !== document && context;
				cachedruns = matcherCachedRuns;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			for ( ; (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
						cachedruns = ++matcherCachedRuns;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !group ) {
			group = tokenize( selector );
		}
		i = group.length;
		while ( i-- ) {
			cached = matcherFromTokens( group[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
	}
	return cached;
};

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function select( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		match = tokenize( selector );

	if ( !seed ) {
		// Try to minimize operations if there is only one group
		if ( match.length === 1 ) {

			// Take a shortcut and set the context if the root selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					context.nodeType === 9 && documentIsHTML &&
					Expr.relative[ tokens[1].type ] ) {

				context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
				if ( !context ) {
					return results;
				}

				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && context.parentNode || context
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}

						break;
					}
				}
			}
		}
	}

	// Compile and execute a filtering function
	// Provide `match` to avoid retokenization if we modified the selector above
	compile( selector, match )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector )
	);
	return results;
}

// Deprecated
Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

// Check sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Initialize with the default document
setDocument();

// Always assume the presence of duplicates if sort doesn't
// pass them to our comparison function (as in Google Chrome).
[0, 0].sort( sortOrder );
support.detectDuplicates = hasDuplicate;

// EXPOSE
if ( typeof define === "function" && define.amd ) {
	define(function() { return Sizzle; });
} else {
	window.Sizzle = Sizzle;
}

// EXPOSE
//!!!
window.Sizzle = Sizzle;

})( window );
/*jslint nomen: true, plusplus: true, vars: true, browser: true */
/*global HTMLElement, ActiveXObject */

var $x = (function(sizzle){
  'use strict';

  var attrMap = {
    tabindex: 'tabIndex',
    readonly: 'readOnly',
    'for': 'htmlFor',
    'class': 'className',
    maxlength: 'maxLength',
    cellspacing: 'cellSpacing',
    cellpadding: 'cellPadding',
    rowspan: 'rowSpan',
    colspan: 'colSpan',
    usemap: 'useMap',
    frameborder: 'frameBorder',
    contenteditable: 'contentEditable'
  };

  var keyCodesMap = {
    'ENTER': 13,
    'INSERT': 45,
    'DELETE': 46,
    'HOME': 36,
    'END': 35,
    'PAGEUP': 33,
    'PAGEDOWN': 34,
    'UP': 38,
    'DOWN': 40,
    'LEFT': 37,
    'RIGHT': 39,
    'ESCAPE': 27,
    'SPACE': 32,
    'BACKSPACE': 8,
    'TAB': 9
  };

  var modifierKeyCodes = [16,17,18];

  return {
    /**************************************************************************/
    /***  General  ************************************************************/
    /**************************************************************************/

    /** Returns a type of a variable or compares the variable type to supplied type
     * @param {Mixed} v Subject variable
     * @param {String} checkType Type to be compared to
     * @returns {String|Boolean} True/False if checkType was supplied; False if type was undefined or string for any other type
     */
    type: function(v, checkType){
      var getType = function(v){
        var t = typeof v;
        if(v === null){ return 'null'; }
        if(t === 'undefined'){ return checkType ? 'undefined' : undefined; } //when checkType specified: $x.type(undefined, 'undefined') => true; no checkType: $x.type(undefined) => undefined - this is meant to be used like this: if(!$x.type(someVar)){ console.log('someVar is undefined'); } which is more convenient than if($x.type(someVar, 'undefined')){ ... }
        if(t === 'string' || v instanceof String){ return 'string'; }
        if(t === 'number' || v instanceof Number){ return 'number'; }
        if(t === 'boolean' || v instanceof Boolean){ return 'boolean'; }
        if(v instanceof Array){ return 'array'; }
        if(v instanceof Date){ return 'date'; }
        if(v instanceof RegExp){ return 'regex'; }
        if(v instanceof Function) { return 'function'; }
        if(v instanceof HTMLElement){ return 'html'; }
        if(v instanceof Object){ return 'object'; }
        //not implementing other node types for now

        //it should never reach this point
        return 'unknown';
      };

      var type = getType(v);
      if(checkType){ return (type===checkType) ? true : false; }
      return type;
    },

    /** Calls a specified function on every element from supplied collection
     * @param {HTMLelement|Array} elements HTML collection
     * @param {Function} fn Function to be called
     */
    each: function(elements, fn){
      if($x.type(elements, 'array')){
        var ret = false;
        for(var i in elements){
          if(elements.hasOwnProperty(i)){
            ret = fn.call(elements[i], i);
            if(ret===false){ break; }
          }
        }
      }
      else if(!$x.type(elements, 'html')){
        throw new Error('first argument must be an HTMLElement or an Array of HTMLElements');
      }
      fn.apply(elements);

      return true;
    },


    /**************************************************************************/
    /***  DOM Related  ********************************************************/
    /**************************************************************************/

    /** Gets all matching elements by selector
     * @param {String} selector Any querySelector-compatible CSS selector
     * @param {HTMLelement} parentNode Parent element - only elements within this element will be considered in the search
     * @returns {Array} HTML collection of matching elements
    */
    get: function(selector, parentNode){
      if($x.type(selector)==='html'){
        return [selector];
      }
      return sizzle(selector, parentNode);
    },

    /** Gets first matching element by selector
     * @param {String} selector Any querySelector-compatible CSS selector
     * @param {HTMLelement} parentNode Parent element - only elements within this element will be considered in the search
     * @returns {HTMLelement} First matching HTML element
    */
    get1: function(selector, parentNode){
      if($x.type(selector)==='html'){
        return selector;
      }
      return sizzle(selector, parentNode)[0];
    },

    /** Gets/sets text of an element
     * @param {HTMLElement} element Subject HTML element
     * @param {String} value (optional) The text we want to set
     * @returns {String|Boolean:True} If value is specified, it returns True, otherwise returns the text of the element
    */
    text: function(element, value){
      if($x.type(value)){ //not undefined? it's a setter!
        element.textContent = value;
        return true;
      }
      //getter
      return element.textContent;
    },

    /** gets an attribute or sets one or more attributes
     * (element {HTMLElement}, attribute {String}) - gets an attribute
     * (element {HTMLElement}, attribute {String}, value {String}) - sets a single attribute
     * (element {HTMLElement}, 'data', dataProperties {Object}) - sets multiple data attributes
     * (element {HTMLElement}, 'style', styleProperties {Object}) - sets multiple style properties
     * (element {HTMLElement}, 'class', classes {Array}) - sets multiple classes (removes all existing classes)
     * (element {HTMLElement}, attributes {Object}) - sets multiple attributes at once (can be a mix of any of the above)
     */
    attr: function(element, attribute, value){
      var attributeType = $x.type(attribute);

      var convertToDashed = function(prop){
        if(prop==='cssFloat'){ prop = 'float'; }
        else{
          prop = prop.replace(/([A-Z])/g, function (strMatch, p1){
            return '-'+p1.toLowerCase();
          });
        }
        return prop;
      };

      var _attr = function(element, attribute, value){
        var valueType = $x.type(value);

        if(attribute.toLowerCase()==='classname'){ attribute = 'class'; }

        if(attribute==='style' && valueType==='object'){ //stringify style
          var styleArray = [];
          for(var prop in value){
            if(value.hasOwnProperty(prop)){
              styleArray.push(convertToDashed(prop) + ':' + value[prop]);
            }
          }
          value = styleArray.join(';') + ';';
        }
        else if(attribute==='class' && valueType==='array'){ //stringify class
          value = value.join(' ');
        }
        else if(attribute==='data' && valueType==='object'){ //create data attributes
          var dataObj = value;
          for(var dataProp in dataObj){ if(dataObj.hasOwnProperty(dataProp)){
            _attr(element, 'data-'+dataProp, dataObj[dataProp]);
          }}

          return;
        }

        var attrName = attrMap[attribute];
        if(attrName){
          element[attrName] = value;
        }
        else{
          element.setAttribute(attribute, value);
        }
      };

      if(attributeType==='string'){ //set/get attribute
        if(!$x.type(value)){ //getter
          var attrName = attrMap[attribute];
          if(attrName){
            return element[attrName];
          }
          else{
            return element.getAttribute(attribute);
          }
        }
        else{ //setter
          _attr(element, attribute, value);
        }
      }
      else if(attributeType==='object'){ //set multiple attributes
        for(var _attribute in attribute){ if(attribute.hasOwnProperty(_attribute)){
          _attr(element, _attribute, attribute[_attribute]);
        }}
      }

      return true;
    },

    /** checks whether an element has a specified attribute
     * @param {HTMLElement} element - Subject element
     * @param {String} attribute - Attribute name
     * @returns {Boolean} true if attribute exists (even if empty), otherwise false
     */
    hasAttr: function(element, attribute){
      var attrName = attrMap[attribute];
      if(attrName){
        return $x.type(element[attrName]) ? true : false;
      }
      else{
        return element.hasAttribute(attribute);
      }
    },

    /** removes an attribute or multiple attributes from an element
     * (element {HTMLElement}, attributes {String}) - removes one or more (space-separated) attributes
     * (element {HTMLElement}, attributes {Array}) - removes attributes defined in an array
     */
    removeAttr: function(element, attribute){
      var attributeType = $x.type(attribute);

      var _removeAttr = function(element, attributes){
        for(var a=0,length=attributes.length; a<length; a++){
          if(attributes[a].length){
            element.removeAttribute(attributes[a]);
          }
        }
      };

      if(attributeType==='string'){
        if(attribute.indexOf(' ')>-1){
          attribute = attribute.split(' ');
        }
        else{
          attribute = [attribute];
        }
      }

      if(attribute.length){
        _removeAttr(element, attribute);
      }

      return true;
    },

    /** Creates HTML element
     * @param {String} tagName Tag name
     * @param {Object} attrs Attributes. Note: style attribute can be specified as an Object (use JS-compatible property names) or as a String (use CSS-compatible property names). Object will be automatically converted to a string and property names will be automatically made CSS-compatible.
     * @param {String} innerHTML Inner HTML
     * @returns {HTMLelement} The created element
     */
    el: function(tagName, attrs, content){
      var el = document.createElement(tagName);

      $x.attr(el, attrs);

      var contentType = $x.type(content);
      if(contentType==='string'){ //treat as html code
        el.innerHTML = content;
      }
      else if(contentType==='html'){
        $x.append(content, el);
      }
      else if(contentType==='array'){
        for(var a=0,length=content.length; a<length; a++){
          $x.append(content[a], el);
        }
      }

      return el;
    },

    /** Appends HTML element to another element
     * @param {HTMLelement} element Subject element
     * @param {HTMLelement} parentNode Subject element will be appended to this element
     */
    append: function(element, parentNode){
      if(!$x.type(parentNode)){ parentNode = document.body; }

      parentNode.appendChild(element);
    },

    /** Prepends HTML element to another element (inserts as first child)
     * @param {HTMLelement} element Subject element
     * @param {HTMLelement} parentNode Subject element will be prepended to this element
    */
    prepend: function(element, parentNode){
      if(!$x.type(parentNode)){ parentNode = document.body; }
      var first = parentNode.firstChild;
      if(first){
        parentNode.insertBefore(element, first);
      }
      else{
        parentNode.appendChild(element);
      }
    },

    /** Inserts an element after the specified node
     * @param {HTMLelement} element Subject element
     * @param {HTMLelement} relativeNode Subject element will be inserted right after this element
     */
    after: function(element, relativeNode){
      var next = relativeNode.nextSibling;
      var parent = relativeNode.parentNode;
      if(next){
        parent.insertBefore(element, next);
      }
      else{
        parent.appendChild(element);
      }
    },

    /** Inserts an element before the specified node
     * @param {HTMLelement} element Subject element
     * @param {HTMLelement} relativeNode Subject element will be inserted right before this element
     */
    before: function(element, relativeNode){
      relativeNode.parentNode.insertBefore(element, relativeNode);
    },

    /** Removes HTML element from DOM
     * @param {Array|HTMLelement} element Single element or array of elements
    */
    remove: function(element){
      if($x.type(element, 'html')){
        element = [element];
      }

      for(var a=0,length=element.length; a<length; a++){
        var el = element[a];
        if(el.parentNode){
          el.parentNode.removeChild(el);
        }
      }
    },

    /** Gets/sets CSS style of an element. The getter returns property value from computed CSS style
     * @param {HTMLelement} element Subject element
     * @param {String|Object} prop CSS property (getter) or list of CSS properties (setter)
     * @param {Boolean} useParseFloat[=false] Use parseFloat on the property value; works only for getter. Note: this is only meant to work with length/size-related properties such as width, height, font-size etc.
     * @returns {String|Float} If prop is a string then it returns a value of of this property (Float when using parsefloat, otherwise String). When using this method as a setter (i.e. when prop is an object) then the method returns true on success
    */
    style: function(element, prop, useParseFloat){
      if(!$x.type(element, 'html')){
        throw new Error('element is not an HTML element');
      }
      if(!$x.type(prop)){
        throw new Error('prop is not defined');
      }

      if($x.type(prop, 'string')){ //if string then we treat this method as a getter
        var strValue = '';
        if(document.defaultView && document.defaultView.getComputedStyle){
          if(prop==='cssFloat'){ prop = 'float'; }
          else{
            prop = prop.replace(/([A-Z])/g, function (strMatch, p1){
              return '-'+p1.toLowerCase();
            });
          }
          if(document.defaultView.getComputedStyle(element, '')){ strValue = document.defaultView.getComputedStyle(element, '').getPropertyValue(prop); }
          else { strValue = false; }
        }
        else if(element.currentStyle){
          strValue = element.currentStyle[prop];
        }
        if(useParseFloat){
          var ret = parseFloat(strValue, 10) || 0;
          return ret;
        }
        else{ return strValue; }
      }
      else if($x.type(prop, 'object')){ //otherwise treat this method as a getter and assume that prop is an Object Literal
        for(var i in prop){
          if(prop.hasOwnProperty(i)){ element.style[i] = prop[i]; }
        }
        return true;
      }
      throw new Error('prop must be a string (getter) or an object (setter)');
    },

    /**
     * Returns a total width of an element limited to a specified boundary
     * @param {HTML element} element Subject element
     * @param {String} limit (width|padding|border|margin) The outermost layer to be taken into account
     * @returns {Integer} The total width of an element
     * @example $x.width(element) //returns element's width on its own (without padding, border or margin)
     * @example $x.width(element, 'width') //as above
     * @example $x.width(element, 'padding') //returns: element width + paddingLeft + paddingRight
     * @example $x.width(element, 'border') //returns: element width + paddingLeft + paddingRight + borderLeftWidth + borderRightWidth
     * @example $x.width(element, 'margin') //returns: element width + paddingLeft + paddingRight + borderLeftWidth + borderRightWidth + marginLeft + marginRight
     */
    width: function(element, limit){
      if(!$x.type(limit)){ limit = 'width'; }

      var boxModel = (document.compatMode==="CSS1Compat");
      var total = 0;
      var levels = ['width','padding','border','margin'];

      /* normally levels.indexOf(level) would do but because of IE8... */
      var level = -1;
      for(var a=0;a<levels.length;a++){
        if(levels[a]===limit){
          level = a;
          break;
        }
      }
      if(level===-1){
        throw new Error('unrecognized value for "limit"');
      }

      //get element width
      total = $x.style(element, 'width', true);

      if(level>=1){ //include paddings
        if(boxModel){ //add padding only if we are in CSS1 Compatible mode
          total += $x.style(element, 'paddingLeft', true) + $x.style(element, 'paddingRight', true);
        }
        if(level>=2){ //include borders
          total += $x.style(element, 'borderLeftWidth', true) + $x.style(element, 'borderRightWidth', true);
          if(level===3){ //include margins
            total += $x.style(element, 'marginLeft', true) + $x.style(element, 'marginRight', true);
          }
        }
      }
      else{
        if(!boxModel){ //we're getting the width only so we want to subtract the padding from the width when in NON-CSS1 Compatible mode
          total -= $x.style(element, 'paddingLeft', true) - $x.style(element, 'paddingRight', true);
        }
      }

      return parseInt(total, 10);
    },

    /**
     * Returns a total height of an element limited to a specified boundary
     * @param {HTML element} element Subject element
     * @param {String} limit (height|padding|border|margin) The outermost layer to be taken into account
     * @returns {Integer} The total height of an element
     * @example $x.height(element) //returns element's height on its own (without padding, border or margin)
     * @example $x.height(element, 'height') //as above
     * @example $x.height(element, 'padding') //returns: element height + hPadding
     * @example $x.height(element, 'border') //returns: element height + hPadding + hBorder
     * @example $x.height(element, 'margin') //returns: element height + hPadding + hBorder + hMargin
     */
    height: function(element, limit){
      if(!$x.type(limit)){ limit = 'height'; }

      var boxModel = (document.compatMode==="CSS1Compat");
      var total = 0;
      var levels = ['height','padding','border','margin'];

      /* normally levels.indexOf(level) would do but because of IE8... */
      var level = -1;
      for(var a=0;a<levels.length;a++){
        if(levels[a]===limit){
          level = a;
          break;
        }
      }
      if(level===-1){
        throw new Error('unrecognized value for "limit"');
      }

      //get element height
      total = $x.style(element, 'height', true);

      if(level>=1){ //include paddings
        if(boxModel){ //add padding only if we are in CSS1 Compatible mode
          total += $x.style(element, 'paddingTop', true) + $x.style(element, 'paddingBottom', true);
        }
        if(level>=2){ //include borders
          total += $x.style(element, 'borderTopWidth', true) + $x.style(element, 'borderBottomWidth', true);
          if(level===3){ //include margins
            total += $x.style(element, 'marginTop', true) + $x.style(element, 'marginBottom', true);
          }
        }
      }
      else{
        if(!boxModel){ //we're getting the width only so we want to subtract the padding from the width when in NON-CSS1 Compatible mode
          total -= $x.style(element, 'paddingLeft', true) - $x.style(element, 'paddingRight', true);
        }
      }

      return parseInt(total, 10);
    },

    /** Checks whether an element is a child of another element
     * @param {HTMLElement} subjectElement Subject element
     * @param {HTMLElement} ancestorElement Potential parent element
     * @returns {Boolean} True when the subject element is a child of the parent element, otherwise false
     */
    isChild: function (subjectElement, ancestorElement) {
      if (subjectElement && subjectElement.parentNode) {
        if (subjectElement.parentNode === ancestorElement) {
          return true;
        }
        return this.isChild(subjectElement.parentNode, ancestorElement);
      }
      return false;
    },

    /** Checks whether an element is a child of another element or is equal to that element
     * @param {HTMLElement} subjectElement Subject element
     * @param {HTMLElement} ancestorElement Potential parent element
     * @returns {Boolean} True when the subject element is a child of the parent element, otherwise false
     */
    isWithin: function(element, ancestorElement){
      return (element === ancestorElement || this.isChild(element, ancestorElement));
    },

    /** Finds and ancestor element matching the selector
     * @param {HTMLElement} $element Subject element
     * @param {String} selector Selector
     * @returns {HTMLElement|null} Matching ancestor element or null when no match is found
     */
    closest: function($element, selector){
      var checkParent = function($element, selector){
        var $parent = $element.parentNode;

        if($parent){
          if(sizzle.matchesSelector($parent, selector)){
            return $parent;
          }
          else{
            return checkParent($parent, selector);
          }
        }
        return null;
      };

      return checkParent($element, selector);
    },

    /** Adds event to an element
     * Arguments can be specified in any order - they are recognized by type
     * @param {HTMLElement|Array|Window Object} Subject element or array of elements (defaults to 'window')
     * @param {String} Event name
     * @param {Function} Function
     * @param {Boolean} Capture event
    */
    addEvent: function(){
      var element, event, fn, capture;
      var type = false;
      var a, length;
      for(a=0;a<arguments.length;a++){
        type = $x.type(arguments[a]);
        if(type==='html' || type==='array' || element===window){ element = arguments[a]; }
        else if(type==='string'){ event = arguments[a]; }
        else if(type==='function'){ fn = arguments[a]; }
        else if(type==='boolean'){ capture = arguments[a]; }
      }
      if(!$x.type(element)){ element = window; }
      if(!$x.type(event)){ event = 'domload'; }
      if(!element){
        throw new Error('HTML element not supplied');
      }

      var _addEvent = function(element, event, fn, capture){
      if(!capture){ capture = false; }
        if(event==='domload'){
          if(document.readyState==='interactive'){ fn(); }
          else{ element.addEventListener('DOMContentLoaded', fn, capture); }
        }
        else{
          if(event==='load' && document.readyState==='complete'){ fn(); }
          else{ element.addEventListener(event, fn, capture); }
        }
        return {element : element, event : event, fn : fn, capture : capture};
      };

      if($x.type(element, 'array')){
        var handles = [];
        for(a=0,length=element.length; a<length; a++){
          handles.push(_addEvent(element, event, fn, capture));
        }
        return handles;
      }
      else{
        return _addEvent(element, event, fn, capture);
      }
    },

    /** Removes event from an element
     * @param {Object} handle Event handler; addEvent returns such handler, can also be created manually with following properties: element, event, fn, capture
     */
    removeEvent: function(handle){
      if(handle.event==='domload'){ handle.event = 'DOMContentLoaded'; }
      handle.element.removeEventListener(handle.event, handle.fn, handle.capture);
      return true;
    },

    /** Adds a class or multiple space-separated classes to an element
     * @param (HTMLElement) element Subject element
     * @param (String) cn Class name or names, e.g. 'myClass' or 'myClass1 myClass2'
     */
    addClass: function(element, cn){
      var _this = this;
      var _addClass = function(element, cn){
        if(!$x.type(element, 'html')){
          throw new Error('element is not an HTML element');
        }
        //using string operations insteadof array split/join - it performs much better
        var cstr = ' '+element.className+' ';
        var addClass = function(cn){
          if(cstr.indexOf(' '+cn+' ')===-1){ cstr += cn + ' '; }
        };

        var classes;

        if(cn.indexOf(' ')>-1){ //add multiple
          classes = cn.split(' ');
        }
        else{
          classes = [cn];
        }

        for(var a=0;a<classes.length;a++){
          if(classes[a]){
            addClass(classes[a]);
          }
        }

        element.className = _this.trim(cstr);

        return true;
      };

      if(!$x.type(cn, 'string')){
        throw new Error('cn is not a string');
      }

      var elementType = $x.type(element);
      if(elementType==='html'){
        _addClass(element, cn);
      }
      else if(elementType==='array'){
        for(var a=0,length=element.length;a<length;a++){
          _addClass(element[a], cn);
        }
      }
      else{
        throw new Error('element must be an HTML element or an array');
      }

      return true;
    },

    /** Removes a class or multiple space-separated classes to from an element
     * @param (HTMLElement) element Subject element
     * @param (String) cn Class name or names to be removed, e.g. 'myClass' or 'myClass1 myClass2'
     */
    removeClass: function(element, cn){
      var _this = this;
      var _removeClass = function(element, cn){
        if(!$x.type(element, 'html')){
          throw new Error('element is not an HTML element');
        }
        var cstr = ' '+element.className+' ';
        var removeClass = function(cn){
          if(cstr.indexOf(' '+cn+' ')>=0){ cstr = cstr.replace(' '+cn+' ',' '); }
        };

        var classes;

        if(cn.indexOf(' ')>-1){
          classes = cn.split(' ');
        }
        else{
          classes = [cn];
        }

        for(var a=0;a<classes.length;a++){
          if(classes[a]){
            removeClass(classes[a]);
          }
        }

        element.className = _this.trim(cstr);

        return true;
      };

      if(!$x.type(cn, 'string')){
        throw new Error('cn is not a string');
      }

      var elementType = $x.type(element);
      if(elementType==='html'){
        _removeClass(element, cn);
      }
      else if(elementType==='array'){
        for(var a=0,length=element.length;a<length;a++){
          _removeClass(element[a], cn);
        }
      }
      else{
        throw new Error('element must be an HTML element or an array');
      }

      return true;
    },

    toggleClass: function(element, className, toggle){
      if(toggle===true){ //toggle class ON
        this.addClass(element, className);
      }
      else if(toggle===false){ //toggle class OFF
        this.removeClass(element, className);
      }
      else{ //if doSwitch is not boolean - then do a regular toggle
        if(this.hasClass(element, className)){
          this.removeClass(element, className);
        }
        else{
          this.addClass(element, className);
        }
      }
    },

    /** Checks whether an element has a specified class
     * @param {HTMLElement} element Subject element
     * @param {String} cn Class name
    */
    hasClass: function(element, cn){
      if(!$x.type(element, 'html')){
        throw new Error('element is not an HTML element');
      }
      if(cn===''){
        throw new Error('cn is empty');
      }
      var elcn = ' '+element.className+' ';
      return ((elcn.indexOf(' '+cn+' ')>-1)) ? true : false;
    },


    /**************************************************************************/
    /***  Events  *************************************************************/
    /**************************************************************************/

    /** Stops event propagation
     * @param {Event} e Event
    */
    stopPropagation: function(e){
      e.stopPropagation();
      return true;
    },

    /** Prevents default event behaviour
     * @param {Event} e Event
    */
    preventDefault: function(e){
      e.preventDefault();
      return true;
    },

    /** Fires event on an element
     * @param {HTMLElement} element Subject element
     * @param {String} event Event to be fired
    */
    trigger: function(element, event){
      var ev = false;
      if (document.createEventObject){ //IE
        ev = document.createEventObject();
        return element.fireEvent('on'+event, ev);
      }
      else{ //standard compliant browsers
        ev = document.createEvent("HTMLEvents");
        ev.initEvent(event, true, true);
        return !element.dispatchEvent(ev);
      }
    },

    /** gets pressed keys or compares pressed keys against a supplied set of keys
     * (e, asString[false]) - gets pressed keys
     *   @param {Event} e - valid keyboard event (keydown/keypress/keyup)
     *   @param {Boolean} asString - whether to return pressed keys as a string (see below for more information on format)
     *   @returns {String|Object} returns pressed keys (see below for more information on format)

     * (e, expectedKeys, noStrict[false]) - compares the pressed keys to the keys specified in second argument
     *   @param {Event} e - valid keyboard event (keydown/keypress/keyup)
     *   @param {String|Object} expectedKeys - expected pressed keys
     *   @param {Boolean} noStrict - whether to allow extra keys to be pressed, e.g. with noStrict=true: if expecting CTRL+S to be pressed but CTRL+SHIFT+S was actually pressed then true will be returned
     *   @returns {Boolean} true if expected keys match pressed keys, otherwise false; takes noStrict param into account

     * ###########################################################################

     * Format of keys as object (both for passing in and returned value):
     * {
     *   alt: {Boolean}, //whether alt key was pressed
     *   ctrl: {Boolean}, //whether alt key was pressed
     *   shift: {Boolean}, //whether alt key was pressed
     *   key: {String} //main key identifier (see below)
     * }
     *  Note: meta key is not supported since it is not cross-platform compatible
     *
     * Format of keys as string (both for passing in and returned value):
     *   Example: (ALT+CTRL+SHIFT+A)
     *   Rules:
     *   - Keys are plus-separated
     *   - Modifier keys are always sorted alphabetically and the main key always comes last (the order doesnt matter when passing in)
     *   - All keys are in uppercase (doesnt matter when passing in)
     *
     * Main key identifier - allowed formats:
     *   - named keys: ENTER,INSERT,DELETE,HOME,END,PAGEUP,PAGEDOWN,UP,DOWN,LEFT,RIGHT,ESCAPE,SPACE,BACKSPACE,TAB
     *   - alpha-numeric characters: /[A-Z0-9]/ e.g. 'A' or '1'
     *   - function keys F1-F12: /F[1-9]|F1[0-2]/ e.g. 'F1' or 'F12'
     *   - keys by key code: /C[0-9]+/ e.g. 'C40'
     */
    keysPressed: function(e, keys, noStrict){
      var keysType = $x.type(keys);

      if(keysType==='string' || keysType==='object'){
        var expectedKeys = [];
        var keysPressedFromEvent = this.keysPressed(e); //actual pressed keys - as an object
        var keyCode;
        var matches = 0; //number of matched keys found - used for strict matching - number of matches must equal number of actual keys pressed
        var foundKeys = { //map of found keys - used to detect mistakes in the input keys such as specifying multiple keys of the same type, e.g.: 'CTRL + A + B' (two 'main' keys) or 'ALT + ALT + B' (two alts)
          alt: false,
          shift: false,
          ctrl: false,
          normal: false
        };

        if(keysType==='object'){
          if(keys.alt){ expectedKeys.push('ALT'); }
          if(keys.ctrl){ expectedKeys.push('CTRL'); }
          if(keys.shift){ expectedKeys.push('SHIFT'); }
          if(keys.key){
            //normalize to string - in case of a digit key specified as an integer
            if($x.type(keys.key, 'number')){
              keys.key = keys.key.toString();
              if(!/^[0-9]$/.test(keys.key)){
                throw new Error('main key must be a correct key identifier (named key, alpha-numeric, F(xx) function key or Cxx key (by keycode))');
              }
            }
            expectedKeys.push(keys.key);
          }
        }
        else{
          //normalize the string
          keys = keys.replace(/[ ]+/g, '').toUpperCase(); //remove all spaces convert the whole string to uppercase
          expectedKeys = keys.split('+'); //an array of all keys expected to be pressed
        }

        for(var a=0;a<expectedKeys.length;a++){
          var expectedKey = expectedKeys[a];
          if(expectedKey==='ALT'){ //alt key
            if(foundKeys.alt){
              throw new Error('ALT key is present multiple times in the string');
            }
            foundKeys.alt = true;
            if(e.altKey){ matches++; }
            else { return false; }
          }
          else if(expectedKey==='CTRL'){ //ctrl key
            if(foundKeys.ctrl){
              throw new Error('CTRL key is present multiple times in the string');
            }
            foundKeys.ctrl = true;
            if(e.ctrlKey){ matches++; }
            else { return false; }
          }
          else if(expectedKey==='SHIFT'){ //shift key
            if(foundKeys.shift){
              throw new Error('SHIFT key is present multiple times in the string');
            }
            foundKeys.shift = true;
            if(e.shiftKey){ matches++; }
            else { return false; }
          }
          else { //main key
            if(foundKeys.main){
              throw new Error('Main key is present multiple times in the string');
            }
            foundKeys.main = true;

            //expectedKey - can be A-Z, 0-9, F[0-9]+, C[0-9]+ or a named key. 0-9 can be either string or number...
            //keysPressedFromEvent(e).key - key code (integer)

            if(keyCodesMap[expectedKey]){ //key by name
              if(keyCodesMap[expectedKey]===keysPressedFromEvent.key){ matches++; }
              else { return false; }
            }
            else if(/^[A-Z0-9]$/.test(expectedKey)){ //letter or digit
              keyCode = expectedKey.toString().charCodeAt(0); //casting string type because digits can be passed in as type:number
              if(keysPressedFromEvent.key===keyCode){ matches++; }
              else { return false; }
            }
            else if(/^F[1-9]|F1[0-2]$/.test(expectedKey)){ //function key (only F1-F12 are supported)
              var fNumber = parseInt(expectedKey.substring(1), 10);
              if((expectedKey>=112 || expectedKey<=123) && keysPressedFromEvent.key===112+fNumber-1){ matches++; }
              else { return false; }
            }
            else if(/^C[0-9]+$/.test(expectedKey)){ //keycode
              keyCode = parseInt(expectedKey.substring(1), 10);
              if(keyCode===keysPressedFromEvent.key){ matches++; }
              else { return false; }
            }
            else { //not recognized
              throw new Error('expectedKeys['+a+'] was not recognized');
            }
          }
        }

        if(!noStrict){ //strict
          return ($x.count(keysPressedFromEvent)===matches); //number of actual expectedKeys pressed must be equal to number of matched keys pressed
        }
        else{
          return true; //everything went well so we return true, i.e. all required keys matched pressed keys
        }
      }
      else { //simply return pressed keys
        var key = parseInt(e.keyCode || e.charCode || e.which || e.keyIdentifier, 10);
        var pressedKeys = [];

        if(keys){
          //get modifier keys in alphabetical order - do not change the order of the following three lines
          if(e.altKey){ pressedKeys.push('ALT'); }
          if(e.ctrlKey){ pressedKeys.push('CTRL'); }
          if(e.shiftKey){ pressedKeys.push('SHIFT'); }

          var fromMap = $x.search(key, keyCodesMap, true);

          if(!$x.search(key, modifierKeyCodes)){ //ignore modifier keys
            //get the "main" key
            if(fromMap){ //named key
              pressedKeys.push(fromMap);
            }
            else if(key>=112 && key<=123){ //function keys
              pressedKeys.push('F' + (key - 112 + 1));
            }
            else if(key>=48 && key<=90){ //alpha-numeric
              pressedKeys.push(String.fromCharCode(key)); //return the character in uppercase
            }
            else {
              pressedKeys.push('C'+key);
            }
          }

          return pressedKeys.join('+').toUpperCase();
        }
        else{
          return {
            alt: e.altKey,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            key: !$x.search(key, modifierKeyCodes) ? key : false
          };
        }
      }
    },

    mousePos: function(e){
      var mx, my = false;
      if (document.all){
        mx = (document.documentElement && document.documentElement.scrollLeft) ? document.documentElement.scrollLeft : document.body.scrollLeft;
        my = (document.documentElement && document.documentElement.scrollTop) ? document.documentElement.scrollTop : document.body.scrollTop;
        mx += window.event.clientX;
        my += window.event.clientY;

      }
      else{
        mx = e.pageX;
        my = e.pageY;
      }

      return { x : mx, y : my };
    },


    /**************************************************************************/
    /***  String  *************************************************************/
    /**************************************************************************/

    /** Strips html tags from string
     * @param {String} string Input string
     * @returns {String} Stripped string
     */
    stripHtml: function(string){
      return string.replace(/(<[^>]+>)/g, '');
    },

    /** Replaces special HTML characters in a string with their HTML code equivalents
     * @param {String} string Input string
     * @returns {String} Replaced string
    */
    htmlSpecialChars: function(string){
      return string.replace(/&/g, '&amp;')
                     .replace(/</g, '&lt;')
                     .replace(/>/g, '&gt;')
                     .replace(/'/g, '&#39;')
                     .replace(/"/g, '&quot;');
    },

    /** Strips whitespace from beginning and end of a string
     * @param {String} string Input string
     * @param {String} character Custom Regex-compatible character to be stripped; defaults to whitespace (\\s)
     * @returns {String} Trimmed string
     */
    trim: function(string, character){
      if(!$x.type(character)){ character = '\\s'; }
      return string.replace(new RegExp('^'+character+'+|'+character+'+$', 'g'), '');
    },

    /** Strips whitespace from the beginning of a string
     * @param {String} string Input string
     * @param {String} character Custom Regex-compatible character to be stripped; defaults to whitespace
     * @returns {String} Trimmed string
     */
    trimLeft: function(string, character){
      if(!character){ character = '\\s'; }
      return string.replace(new RegExp('^'+character+'+', 'g'), '');
    },

    /** Strips whitespace from the end of a string
     * @param {String} string Input string
     * @param {String} character Custom Regex-compatible character to be stripped; defaults to whitespace
     * @returns {String} Trimmed string
     */
    trimRight: function(string, character){
      if(!character){ character = '\\s'; }
      return string.replace(new RegExp(''+character+'+$', 'g'), '');
    },

    /** Repeats a string a given number of times
     * @param {String|Number} string Input string or number
     * @param {Integer} length Number of times the string should be repeated
     * @returns {String} Repeated string
     */
    repeat: function(string, length){
      string = String(string);
      return (new Array(length + 1)).join(string);
    },

    /** Pads a string with a specified character
     * @param {String|Number} string Input string or number
     * @param {String} fillCharacter A character to be used for padding
     * @param {Number} places Total length of the final string
     * @returns {String} Padded string
     */
    pad: function(string, fillCharacter, length){
      string = String(string);
      fillCharacter = String(fillCharacter);
      length -= string.length;
      if(length<=0){ return string; }

      return this.repeat(fillCharacter, length)+string;
    },

    /** Pads a string on the right side with a specified character
     * @param {String|Number} string Input string or number
     * @param {String} fillCharacter A character to be used for padding
     * @param {Number} places Total length of the final string
     * @returns {String} Padded string
     */
    padRight: function(string, fillCharacter, length){
      string = String(string);
      fillCharacter = String(fillCharacter);
      length -= string.length;
      if(length<=0){ return string; }

      return string+this.repeat(fillCharacter, length);
    },


    /**************************************************************************/
    /***  Number  *************************************************************/
    /**************************************************************************/

    /** Generates a random integer within a given range
     * @param {Integer) min Minimum
     * @param {Integer) max Maximum
     * @returns {Number} Random integer in a given range
     */
    rand: function(min, max){
      if(min > max){ return NaN; }
      return Math.floor(Math.random()*(max-min+1)+min);
    },

    /** Rounds a number with a specified precision
     * @param {Number} num Input number
     * @param {Number} precision Number of decimal places
     * @returns {Number} Rounded number
     */
    round: function(num, precision){
      if(!precision){ return Math.round(num); }
      var p = (precision) ? Math.pow(10, precision) : 1;
      return Math.round(num*p)/p;
    },

    /** calculates a sum of supplied arguments or a sum of values of an array
     * (array {Array}) - calculate sum of array elements
     * (value_1 {Number} .. value_n {Number}) - calculate sum of arguments
     * @returns {Number} The calculated sum
     *          {Number} NaN if any of the arguments were invalid
     *          {Boolean} False if the array was empty
     */
    sum: function(){
      var length = arguments.length;
      var total = 0;

      var type = $x.type(arguments[0]);

      if(type==='array' || type==='object'){
        return this.sum.apply(this, arguments[0]);
      }

      for(var a=0; a<length; a++){
        total += Number(arguments[a]);
      }

      return total;
    },

    /** Calculates an average of supplied arguments or an average of values of an array
     * (array {Array}) - calculate average from array elements
     * (value_1 {Number} .. value_n {Number}) - calculate average from values of arguments
     * @returns {Number} The calculated average
     *          {Number} NaN if any of the arguments were invalid
     *          {Boolean} False if the array was empty
     */
    average: function(){
      if(!arguments.length){ return false; }

      var array = $x.type(arguments[0], 'array') ? arguments[0] : arguments;
      var total = this.sum(array);
      var count = array.length;

      if(isNaN(total)){ return NaN; }

      return total/count;
    },


    /**************************************************************************/
    /***  Array/Object  *******************************************************/
    /**************************************************************************/

    /** Finds a first occurrence of value in an object or an array (strict on types)
     * @param {Mixed} value Value to be found
     * @param {Array|Object} obj Subject array or object
     * @param {Boolean|String|Integer} returnKey=false
     * @returns {String|Integer|Boolean}
     *   returnKey=true: the {String} key will be returned (or {Integer} index if it's an array) if the value was found, otherwise returns {Boolean} false
     *   returnKey=false: {Boolean} true when value was found, otherwise {Boolean} false
     *   on error: undefined
     */
    search: function(value, obj, returnKey){
      var type = $x.type(obj);
      if(type==='array'){
        for(var index=0,length=obj.length; index<length; index++){
          if(obj[index]===value){
            return (returnKey) ? index : true;
          }
        }
      }
      else if(type==='object'){
        for (var key in obj){
          if(obj.hasOwnProperty(key)){
            if(obj[key]===value){
              return (returnKey) ? key : true;
            }
          }
        }
      }

      return false;
    },

    /** Counts number of elements in an array/object
     * @param {Array|Object} obj Subject array or object
     * @returns {Integer} array length or object size
     */
    count: function(obj){
      var type = $x.type(obj);

      if(type==='array'){
        return obj.length;
      }
      else if(type==='object'){
        return Object.keys(obj).length;
      }

      return false;
    },

    /** Merges two or more arrays/objects into one array/object. Every next object overwrites properties of the object to be returned
     *All arguments must be of the same type (either arrays or objects)
     *@param {Array|Object} ... Array/Object
     *@returns {Array|Object} Merged Array/Object
     */
    merge: function(base){
      var baseType = $x.type(base);
      var a,b;
      var newObj;

      if(baseType==='array'){
        newObj = [];
      }
      else if(baseType==='object'){
        newObj = {};
      }
      else{
        throw new Error("expected base argument to be of type: array or object");
      }

      for(a=0;a<arguments.length;a++){
        var thisObj = arguments[a];
        if($x.type(thisObj)!==baseType){ throw new Error("argument types don't match"); }

        if(baseType==='array'){
          newObj = newObj.concat(thisObj);
        }
        else{ //object
          for(b in thisObj){
            if(thisObj.hasOwnProperty(b)){
              newObj[b] = thisObj[b];
            }
          }
        }
      }

      return newObj;
    }
  };
}(window.Sizzle));
/*jslint nomen: true, plusplus: true, vars: true, browser: true */
/*global $x */

$x.date = (function(){
  'use strict';

  var settings = {
    defaultFormat : 'dmy',
    defaultSeparator : '/',
    daysOfWeek : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    months : ['January','February','March','April','May','June','July','August','September','October','November','December']
  };

  /** Creates a new $x.date object
   *  () - creates a new based on current date
   *  ({False|Null} - sets date to timestamp=0
   *  (date {Date}) - creates a date from JS Date object
   *  (timestamp {Number}) - creates a date from a timestamp
   *  (dateString {String}, format {String}, separator{String}) - creates a date from a string; format: dmy/mdy/ymd
   *  (parts {Object}) - creates a date from an object:
   *    {
   *      d: {Integer|Boolean:true}, //day of month
          m: {Integer|Boolean:true}, //month
          y: {Integer|Boolean:true} //year
   *    }
   *    When d,m or y is Boolean:true then the value will be set based on current date
   *    Note: supplying d:true for a month which doesn't have enough days will result in date wrapping (consistent behavior with native Date object)
   */
  var Date = function(date, separator, format){
    var type = $x.type(date);
    if(!type){ this.date = new window.Date(); } //use current date
    else if(date===false || date===null){
      this.date = new window.Date(0); //this is treated as timestamp=0, i.e. 1970-01-01
    }
    else if(type==='date'){
      //forcing creation of a new date object and not storing the reference to the original one
      this.date = new window.Date();
      this.date.setTime(date.getTime());
    } //assume JS date
    else if(type==='number'){ this.date = new window.Date().setTime(date); } //assume timestamp
    else if(type==='object'){ //assume object {d:d,m:m,y:y}
      var today = $x.date();
      if(date.d===true){ date.d = today.day(); }
      if(date.m===true){ date.m = today.month(); }
      if(date.y===true){ date.y = today.year(); }

      date.d = parseInt(date.d, 10);
      date.m = parseInt(date.m, 10);
      date.y = parseInt(date.y, 10);

      this.date = new window.Date(date.y, date.m-1, date.d);
    }
    else if(type==='string'){ //assume human-readable date
      var parts;

      //validate arguments - set default values and check types
      (function(){
        var formatType = $x.type(format);
        var separatorType = $x.type(separator);

        if(!format){ format = settings.defaultFormat; }
        else if(formatType!=='string'){
          throw new Error('"format" is not a string');
        }

        if(!separator){ separator = settings.defaultSeparator; }
        else if(separatorType!=='string'){
          throw new Error('"separator" is not a string');
        }

        //validate date string
        format = format.toLowerCase();
        if(!/^(ymd|dmy|mdy)$/.test(format)){
          throw new Error('"format" must be set to one of the following: ymd, dmy or mdy');
        }
      }());

      parts = date.split(separator);

      //arrange the parts according to specified format
      if(parts.length===3){
        var ymdSorted = [];
        if(format==='ymd'){
          ymdSorted = parts;
        }
        else if(format==='dmy'){
          ymdSorted.push(parts[2]);
          ymdSorted.push(parts[1]);
          ymdSorted.push(parts[0]);
        }
        else if(format==='mdy'){
          ymdSorted.push(parts[2]);
          ymdSorted.push(parts[0]);
          ymdSorted.push(parts[1]);
        }

        ymdSorted[0] = parseInt(ymdSorted[0], 10);
        ymdSorted[1] = parseInt(ymdSorted[1], 10);
        ymdSorted[2] = parseInt(ymdSorted[2], 10);

        this.date = new window.Date(ymdSorted[0], ymdSorted[1]-1, ymdSorted[2]);
      }
      else{
        this.date = new Date(NaN); //make the date invalid date
      }
    }
  };

  /** Converts date into a string using the specified format
   * @param {String} format Format to be used (compatible with PHP date)
   *
   * @returns {String} formatted date
   */
  Date.prototype.format = function(format){

    var arr = [];
    var notFound = false;

    for(var a=0,length=format.length;a<length;a++){
      var ch = format.charAt(a);
      var d;

      switch (ch) {
        case 'd':
          d = this.date.getDate();

          arr.push($x.pad(d, 0, 2));
          break;

        case 'm':
          var m = this.date.getMonth()+1;

          arr.push($x.pad(m, 0, 2));
          break;

        case 'Y':
          arr.push(this.date.getFullYear());
          break;

        case 'D': //three-letter day
          arr.push(settings.daysOfWeek[this.dayOfWeek()-1].substr(0,3));
          break;

        case 'j': //day of month without leading 0
          arr.push(this.date.getDate());
          break;

        case 'l': //(lowercase "L") day of week
          arr.push(settings.daysOfWeek[this.dayOfWeek()-1]);
          break;

        case 'N': //ISO-8601 numeric representation of the day of the week (1=Mon, 7=Sun)
          arr.push(this.dayOfWeek());
          break;

        case 'S': //English ordinal suffix for the day of the month, 2 characters st, nd, rd or th. Works well with j
          d = this.date.getDate();
          var ord = '';
          if(d>20 || d<10){
            switch(d%10){
              case 1:
                ord = "st";
                break;
              case 2:
                ord = "nd";
                break;
              case 3:
                ord = "rd";
                break;

              default:
                ord = "th";
            }
          }
          else{
            ord = "th";
          }

          arr.push(ord);
          break;

        case 'w': //Numeric representation of the day of the week (0=Sun, 6=Sat)
          arr.push(this.dayOfWeek(true));
          break;

        case 'z': //the day of the year starting from 0
          arr.push(this.dayOfYear-1);
          break;

        case 'W': //ISO-8601 week number of year, weeks starting on Monday
          //!!! to be implemented
          break;

        case 'F': //A full textual representation of a month, such as January or March
          arr.push(settings.months[this.date.getMonth()]);
          break;

        case 'M': //A short textual representation of a month, three letters
          arr.push(settings.months[this.date.getMonth()].substr(0,3));
          break;

        case 'n': //Numeric representation of a month, without leading zeros
          arr.push(this.date.getMonth()+1);
          break;

        case 't': //Number of days in a given month
          arr.push(this.daysInMonth());
          break;

        case 'L': //Whether it's a leap year
          arr.push(this.isLeapYear());
          break;

        case 'o': //
          //!!! to be implemented
          break;

        case 'y': //A two digit representation of a year
          arr.push(this.date.getFullYear().substr(2));

          break;

        default:
          notFound = true;
      }

      if(notFound){
        arr.push(ch);

        notFound = false;
      }
    }

    return arr.join('');
  };

  Date.prototype.isValid = function(){
    return !isNaN(this.date.getTime());
  };

  /** Converts the date into an object containing properties: d,m,y
   * @returns {Object} {d:d, m:m, y:y} where all values are integers
   */
  Date.prototype.getObject = function(){
    return {
      d : this.date.getDate(),
      m : this.date.getMonth() + 1,
      y : this.date.getFullYear()
    };
  };

  /** Gets the Date object which is a native JS Date object
   * @returns {Date} JS date object
   */
  Date.prototype.getDateObject = function(){
    return this.date;
  };

  /** Sets or gets a day of month
   * () - gets a day of month
   * (day {String}) - sets a day of month
   * @returns {Integer|Object} if getter: day of month; if setter: "this"
   */
  Date.prototype.day = function(day){
    var dayType = $x.type(day);
    if(!dayType){ //getter
      return this.date.getDate();
    }
    else if(dayType==='string' || dayType==='number'){ //setter
      day = parseInt(day, 10);
      if(isNaN(day)){
        throw new Error('"day" value is incorrect');
      }
      this.date.setDate(day);
      return this; //make chainable
    }

    throw new Error('"day" must be a number or a string representing a number');
  };

  /** Sets or gets month
   * () - gets a month
   * (month {Integer}) - sets a month
   * @returns {Integer|Object} if getter: month number; if setter: "this"
   */
  Date.prototype.month = function(month){
    var monthType = $x.type(month);
    if(!monthType){ //getter
      return this.date.getMonth() + 1;
    }
    else if(monthType==='string' || monthType==='number'){ //setter
      month = parseInt(month, 10);
      if(isNaN(month)){
        throw new Error('"month" value is incorrect');
      }
      this.date.setMonth(month - 1);
      return this; //make chainable
    }

    throw new Error('"month" must be a string or a number');
  };

  /** Sets or gets year
   * () - gets a year
   * (year {Integer}) - sets a year
   * @returns {Integer|Object} if getter: year number; if setter: "this"
   */
  Date.prototype.year = function(year){
    var yearType = $x.type(year);
    if(!yearType){ //getter
      return this.date.getFullYear();
    }
    else if(yearType==='string' || yearType==='number'){ //setter
      year = parseInt(year, 10);
      if(isNaN(year)){
        throw new Error('"year" value is incorrect');
      }
      this.date.setFullYear(year);
      return this; //make chainable
    }

    throw new Error('"year" must be a string or a number');
  };

  /** Gets the number of months
   * @returns {Integer} Number of days in month
   */
  Date.prototype.daysInMonth = function(){
    return new window.Date(this.date.getFullYear(), this.date.getMonth()+1, 0).getDate();
  };

  /** Gets number of days in year
   * @returns {Integer} Number of days in year
   */
  Date.prototype.daysInYear = function(){
    return $x.date('31/12/'+this.date.getFullYear()).dayOfYear();
  };

  /** Gets the day of year
   * @returns {Integer} Day of year
   */
  Date.prototype.dayOfYear = function(){
    var jan1st = new window.Date(this.date.getFullYear(), 0, 1);
    return Math.ceil((this.date - jan1st) / 86400000) + 1;
  };

  /** Gets a day of week
   * @param {Boolean} zeroSunday Whether to use 0 for Sunday or not
   * @returns {Integer} Day of week (zeroSunday set: 0-Sunday, 6-Saturday zeroSunday not set: 1-Monday, 7-Sunday)
   */
  Date.prototype.dayOfWeek = function(zeroSunday){
    return zeroSunday ? this.date.getDay() : this.date.getDay() || 7;
  };

  /** Checks whether the year is a leap year
   * @returns {Boolean} True if the year is a leap year, otherwise false
   */
  Date.prototype.isLeapYear = function(){
    //!!! this can be done better...
    return $x.date({
      d : 29,
      m : 2,
      y : this.year()
    }).daysInYear()===366;
  };

  /** Checks whether the date is today's date
   * @returns {Boolean} True if the date is today's date, otherwise false
   */
  Date.prototype.isToday = function(){
    return this.equal($x.date());
  };

  /** Calculates number of days between the base date and the supplied date (date - date2)
   * @param {$x.date-compatible} date2 Date to compare against
   * @param {Boolean} absolute Whether to return an absolute value; Default:False
   * @returns {Integer} Number of days between the base date and the supplied date
   */
  Date.prototype.dayDiff = function(date2, absolute){
    date2 = $x.date(date2);
    var result = Math.floor((this.date - date2.date)/(24*3600*1000));
    return absolute ? Math.abs(result) : result;
  };

  /** Calculates number of months between the base date and the supplied date (date - date2)
   * Note: there are many different ways to diff two dates to get number of months between. This method works like this:
   * - If date1 is March 31st and dat2 is April 1st of the same year then the diff will be one month even though the day diff is only one day
   * @param {$x.date-compatible} date2 Date to compare against
   * @param {Boolean} absolute Whether to return an absolute value; Default:False
   * @returns {Integer} Number of months between the base date and the supplied date
   */
  Date.prototype.monthDiff = function(date2, absolute){
    date2 = $x.date(date2);

    var m1 = this.month();
    var y1 = this.year();
    var m2 = date2.month();
    var y2 = date2.year();

    var total = (y2-y1)*12;
    total += m2-m1;

    return absolute ? Math.abs(total) : -total;
  };

  /** Calculates number of years between the base date and the supplied date (date - date2)
   * @param {$x.date-compatible} date2 Date to compare against
   * @param {Boolean} absolute Whether to return an absolute value; Default:False
   * @returns {Integer} Number of years between the base date and the supplied date
   */
  Date.prototype.yearDiff = function(date2, absolute){
    date2 = $x.date(date2);

    var result = this.year() - date2.year();
    return absolute ? Math.abs(result) : result;
  };

  /** Checks whether the base date is greater than the supplied date
   * @param {$x.date-compatible} date2 Date to compare against
   * @returns {Boolean} True if the base date is greater than the supplied date, otherwise False
   */
  Date.prototype.greater = function(date2){
    date2 = $x.date(date2);

    return (this.format('Ymd', '') > $x.date(date2).format('Ymd', ''));
  };

  /** Checks whether the base date is greater than or equal to the supplied date
   * @param {$x.date-compatible} date2 Date to compare against
   * @returns {Boolean} True if the base date is greater than or equal to the supplied date, otherwise False
   */
  Date.prototype.greaterEqual = function(date2){
    date2 = $x.date(date2);

    return (this.format('Ymd', '') >= $x.date(date2).format('Ymd', ''));
  };

  /** Checks whether the base date is lower than the supplied date
   * @param {$x.date-compatible} date2 Date to compare against
   * @returns {Boolean} True if the base date is lower than the supplied date, otherwise False
   */
  Date.prototype.lower = function(date2){
    date2 = $x.date(date2);

    return (this.format('Ymd', '') < $x.date(date2).format('Ymd', ''));
  };

  /** Checks whether the base date is lower than or equal to the supplied date
   * @param {$x.date-compatible} date2 Date to compare against
   * @returns {Boolean} True if the base date is lower than or equal to the supplied date, otherwise False
   */
  Date.prototype.lowerEqual = function(date2){
    date2 = $x.date(date2);

    return (this.format('Ymd', '') <= $x.date(date2).format('Ymd', ''));
  };

  /** Checks whether the base date is equal to the supplied date
   * @param {$x.date-compatible} date2 Date to compare against
   * @returns {Boolean} True if the base date is equal to the supplied date, otherwise False
   */
  Date.prototype.equal = function(date2){
    date2 = $x.date(date2);

    return (this.format('Ymd', '') === $x.date(date2).format('Ymd', ''));
  };

  /** Shifts the date by a number of days, months and/or years
   * Note: when multiple arguments are supplied, the years are added first, then months and days are added last.
   * @param {Integer} dOffset Number of days to shift. Note: it can be a negative number too
   * @param {Integer} mOffset Number of months to shift. Note: it can be a negative number too
   * @param {Integer} yOffset Number of years to shift. Note: it can be a negative number too
   * @returns {$x.date object} "this" is returned to make it chainable
   */
  Date.prototype.shift = function(dOffset, mOffset, yOffset){
    var obj = this.getObject();
    if(yOffset){ obj.y = obj.y+(yOffset); }
    if(mOffset){ obj.m = obj.m+(mOffset); }
    if(dOffset){ obj.d = obj.d+(dOffset); }
    this.date = new window.Date(obj.y, (obj.m-1), obj.d);

    return this; //make chainable
  };

  /** clones the current date and returns it as a new object
   * @returns {$x.date object} New instance of $x.date using the same date
   */
  Date.prototype.clone = function(){
    return $x.date(this.getDateObject());
  };

  return function(date, format, separator){
    if(date instanceof Date){ return date; }
    else{ return new Date(date, format, separator); }
  };
}());
/*jslint nomen: true, plusplus: true, vars: true, browser: true */
/*global $x */

$x.fx = (function(){
  'use strict';

  /*** ***/
  var animation = (function () {
    var config = {
      fallbackFrameRate: 25
    };

    /*** Helpers ***/
    var _requestFrame = (function () {
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / config.fallbackFrameRate);
      };
    }());

    var _methods = {
      easeIn: function (t, d, b, f, exp) {
        var val = Math.pow(t / d, exp);
        return $x.round(b + (f - b) * val, 5);
      },

      easeOut: function (t, d, b, f, exp) {
        var val = 1 - Math.pow(1 - (t / d), exp);
        return $x.round(b + (f - b) * val, 5);
      },

      easeInOut: function (t, d, b, f, exp) {
        if (t === 0 || t < d / 2) {
          return _methods.easeIn(t, d / 2, b, b + (f - b) / 2, exp);
        }
        return _methods.easeOut(t - d / 2, d / 2, b + (f - b) / 2, f, exp);
      },

      easeOutIn: function (t, d, b, f, exp) {
        if (t === 0 || t < d / 2) {
          return _methods.easeOut(t, d / 2, b, b + (f - b) / 2, exp);
        }
        return _methods.easeIn(t - d / 2, d / 2, b + (f - b) / 2, f, exp);
      },

      linear: function (t, d, b, f) {
        return $x.round((f - b) * t / d + b, 5);
      }
    };

    var O_animate = function (o) {
      var This = this;

      if (!$x.type(o.startVal, 'number')) {
        throw new Error('$x.fx.Animate: o.startVal is not a number');
      }
      if (!$x.type(o.fnChange, 'function')) {
        throw new Error('$x.fx.Animate: o.fnChange is not a function');
      }
      if (o.startVal === o.endVal) {
        throw new Error('$x.fx.Animate: o.startVal is equal to o.endVal');
      }
      if (o.method && !(/^easeIn|easeOut|easeInOut|easeOutIn|linear$/.test(o.method))) {
        throw new Error('$x.fx.Animate: o.method is not recognized');
      }
      if (!o.method) {
        o.method = 'easeInOut';
      }
      if (!o.factor) {
        o.factor = 2;
      }
      if (!o.duration) { //will also replace 0 - intentional
        o.duration = 500;
      }

      this.settings = o;
      this.timeElapsed = 0;

      this.startTime = new Date().getTime() - (o.startPosition || 0);
      this._pause = false;
      this.isInProgress = true;
      this.isPaused = false;

      _requestFrame(function(){
        This._frame();
      });

      return true;
    };

    O_animate.prototype._frame = function () {
      var This = this;

      if (this._pause) {
        this.isPaused = true;
        return false;
      }
      this.timeElapsed = new Date().getTime() - this.startTime;

      var s = this.settings;

      if (this.timeElapsed >= this.settings.duration) {
        s.fnChange(_methods[s.method](s.duration, s.duration, s.startVal, s.endVal, s.factor)); //the final step to make sure that it gets the final value in the end
        this.isInProgress = false;
        if (s.callback) {
          s.callback();
        } //execute the callback
      }
      else {
        s.fnChange(_methods[s.method](this.timeElapsed, s.duration, s.startVal, s.endVal, s.factor));
        _requestFrame(function () {
          This._frame();
        });
      }

      return true;
    };

    O_animate.prototype.pause = function () {
      this._pause = true;
    };

    O_animate.prototype.skip = function () {
      var This = this;
      this.timeElapsed = this.settings.duration;
      _requestFrame(function(){
        This._frame();
      });
    };

    O_animate.prototype.resume = function () {
      var This = this;
      this._pause = false;
      this.isPaused = false;
      this.startTime = new Date().getTime() - this.timeElapsed;
      _requestFrame(function(){
        This._frame();
      });
    };

    return function (o) {
      return new O_animate(o);
    };
  }());

  /** Fades an element from one opacity value to another
   *
   */
  var fade = function (o) {
    /*** validate arguments / set default values ***/
    if (!$x.type(o.el, 'html')) {
      throw new Error('o.el is not an HTML element');
    }
    o.startVal = parseFloat($x.style(o.el, 'opacity'), 10) || 0;

    o.fnChange = function (newVal) {
      $x.style(o.el, {
        opacity: newVal
      });
    };

    return animation(o);
  };

  var move = function (o) {
    /*** validate arguments / set default values ***/
    if (!$x.type(o.el, 'html')) {
      throw new Error('o.el is not an HTML element');
    }
    if (!o.from || ',top,right,bottom,left,'.indexOf(o.from) === -1) {
      throw new Error('o.from is not recognized');
    }
    var parts = /^(-?\d+(\.\d+)?)(.*)$/.exec($x.style(o.el, o.from));
    var unit = (parts && parts[3]) ? parts[3] : 'px';

    if (!$x.type(o.startVal, 'number')) {
      o.startVal = (parts && parts[1]) ? Math.round(parseFloat(parts[1], 10)) : 0;
    }
    o.endVal = Math.round(o.endVal);

    o.fnChange = function (newVal) {
      o.el.style[o.from] = newVal + unit;
    };

    return animation(o);
  };

  var resize = function (o) {
    /*** validate arguments / set default values ***/
    if (!$x.type(o.el, 'html')) {
      throw new Error('o.el is not an HTML element');
    }
    if (!o.side || ',width,height,'.indexOf(o.side) === -1) {
      throw new Error('o.side is not recognized');
    }

    var parts = /^(\d+)(.*)$/.exec(o.el.style[o.side]);
    var unit = (parts && parts[2]) ? parts[2] : 'px';
    o.startVal = (parts && parts[1]) ? parseInt(parts[1], 10) : 0;

    o.fnChange = function (newVal) {
      o.el.style[o.side] = newVal + unit;
    };

    return animation(o);
  };

  return {
    fade: fade,
    move: move,
    resize: resize,
    animation: animation
  };
}());
/*jslint nomen: true, plusplus: true, vars: true, browser: true, devel: true */
/*global $x */

$x.url = (function(){
  'use strict';

  /* Creates a new url object
   * (false {Boolean}) - sets an empty url
   * (true {Boolean}) - creates a url from current url
   * (url {String}) - creates a url from string
   * (url {Object}) - creates a url from key/value pairs (scheme, host, port, segments[], params{})
   */
  var Url = function(url){
    this.set(url);
    this.currentUrl = this._parse(window.location.href);

    return this;
  };

  /** gets the url as a string
   */
  Url.prototype.get = function(){
    var str = this.domain() || '';

    if(str.length){ str += '/'; } //append slash if domain is not empty

    if(this.urlParts.segments.length){
      str += this.urlParts.segments.join('/');
    }

    if($x.count(this.urlParts.params)){
      var joined = [];
      for(var i in this.urlParts.params){ if(this.urlParts.params.hasOwnProperty(i)){
        joined.push(i + '=' + this.urlParts.params[i]);
      }}
      str += '?' + joined.join('&');
    }

    if(this.urlParts.partial){
      str += '#'+this.urlParts.partial;
    }

    return str;
  };

  /** sets the url to the value
   * (false {Boolean}) - sets an empty url
   * (true {Boolean}) - creates a url from current url
   * (url {String}) - creates a url from string
   * (url {Object}) - creates a url from key/value pairs (scheme, host, port, segments[], params{})
   */
  Url.prototype.set = function(url){
    var type = $x.type(url);
    var urlStr = '';

    if(url===false){
      this.urlParts = this._getBlankUrlPartsObject();
    }
    else if(url===true){
      this.urlParts = this._parse(window.location.href);
    }
    else if(type==='string'){
      this.urlParts = this._parse(url);
    }
    else if(type==='object'){
      this.urlParts = $x.merge(this._getBlankUrlPartsObject(), url);
    }

    return this;
  };

  /** unsets the url
   */
  Url.prototype.unset = function(){
    this.set(false);
    return this;
  };

  /** returns a blank urlParts object
   */
  Url.prototype._getBlankUrlPartsObject = function(){
    return JSON.parse(JSON.stringify({
      scheme : null,
      username : null,
      password : null,
      host : null,
      port : null,
      segments : [],
      params : {},
      partial : null
    }));
  };

  /** parses the specified url
   * (urlStr {String})
   *
   * @returns {Object} parsed url
   */
  Url.prototype._parse = function(urlStr){
    var urlParts = this._getBlankUrlPartsObject();

    var schemeSeparatorPos = -1;
    var hostSeparatorPos = -1;
    var qstrSeparatorPos = -1;
    var partialSeparatorPos = -1;
    var hostStr = null;
    var segmentsStr = null;
    var queryStr = null;

    var isAbsolute = /^[A-Za-z]+:\/\//.test(urlStr);

    if(isAbsolute){
      schemeSeparatorPos = urlStr.indexOf('://');
      hostSeparatorPos = urlStr.indexOf('/', schemeSeparatorPos+3);
      hostStr = urlStr.substring(schemeSeparatorPos+3, hostSeparatorPos>=0 ? hostSeparatorPos : undefined);

      //get scheme
      urlParts.scheme = urlStr.substring(0, schemeSeparatorPos);


      //get host parts
      if(hostStr){
        var credentialsSeparatorPos = hostStr.indexOf('@');
        if(credentialsSeparatorPos>=0){
          var credentialsParts = hostStr.substring(0, credentialsSeparatorPos).split(':');
          urlParts.username = credentialsParts[0];
          if(credentialsParts[1]){ urlParts.password = credentialsParts[1]; }
          hostStr = hostStr.substring(credentialsSeparatorPos+1); //strip credentials from the hostStr
        }

        var portSeparatorPos = hostStr.indexOf(':');
        if(portSeparatorPos>=0){
          urlParts.port = hostStr.substring(portSeparatorPos+1);
          hostStr = hostStr.substring(0, portSeparatorPos); //strip port from the hostStr
        }

        urlParts.host = hostStr;
      }

      //get rid of everything before the host separator
      urlStr = urlStr.substring(hostSeparatorPos>=0 ? hostSeparatorPos+1 : urlStr.length);
    }


    //get partial
    partialSeparatorPos = urlStr.indexOf('#');
    if(partialSeparatorPos>=0){
      urlParts.partial = urlStr.substring(partialSeparatorPos+1);
      urlStr = urlStr.substring(0, partialSeparatorPos);
    }

    qstrSeparatorPos = urlStr.indexOf('?');
    segmentsStr = urlStr.substring(0, qstrSeparatorPos>=0 ? qstrSeparatorPos : undefined);
    queryStr = qstrSeparatorPos>=0 ? urlStr.substring(qstrSeparatorPos+1) : null;

    //get segments
    if(segmentsStr){
      segmentsStr = segmentsStr.replace(/\/$/, ''); //remove trailing slash
      urlParts.segments = segmentsStr.split('/');
    }

    //get params
    if(queryStr){
      var paramsJoined = queryStr.split('&');
      for(var a=0,length=paramsJoined.length; a<length; a++){
        //param can look like this: ?param=value=stillValueOfTheParam (i.e. multiple equal signs), so basically param name is everything before the first '=' and value is the rest
        var qstrParts = paramsJoined[a].split('=');
        var name = qstrParts.shift(); //get the first part off the array
        var value = qstrParts.join('='); //join the rest using '=' as glue
        urlParts.params[name] = value;
      }
    }

    return urlParts;
  };

  /** sets, unsets or gets the scheme
   * () - gets the scheme
   * (scheme {string}) - sets the scheme
   * (true {boolean}) - sets scheme to current scheme (from window.location.href)
   * (false {boolean}) - unsets the scheme
   */
  Url.prototype.scheme = function(scheme){
    var type = $x.type(scheme);
    if(type==='string'){ //setter
      this.urlParts.scheme = scheme;
    }
    else if(scheme===true){ //use current scheme from window.location.href
      this.urlParts.scheme = this.currentUrl.scheme;
    }
    else if(scheme===false){ //remove scheme
      this.urlParts.scheme = null;
    }
    else if(!type){ //getter
      return this.urlParts.scheme;
    }
    else{
      throw new Error('Scheme must be a string, boolean or undefined');
    }
    return this;
  };

  /** sets, unsets or gets the username
   * () - gets the username
   * (username {string}) - sets the username
   * (true {boolean}) - sets username to current username (from window.location.href)
   * (false {boolean}) - unsets the username
   */
  Url.prototype.username = function(username){
    var type = $x.type(username);
    if(type==='string'){ //setter
      this.urlParts.username = username;
    }
    else if(username===true){ //use current scheme from window.location.href
      this.urlParts.username = this.currentUrl.username;
    }
    else if(username===false){ //remove username
      this.urlParts.username = null;
    }
    else if(!type){ //getter
      return this.urlParts.username;
    }
    else{
      throw new Error('Username must be a string, boolean or undefined');
    }
    return this;
  };

  /** sets, unsets or gets the password
   * () - gets the password
   * (password {string}) - sets the password
   * (true {boolean}) - sets password to current password (from window.location.href)
   * (false {boolean}) - unsets the password
   */
  Url.prototype.password = function(password){
    var type = $x.type(password);
    if(type==='string'){ //setter
      this.urlParts.password = password;
    }
    else if(password===true){ //use current scheme from window.location.href
      this.urlParts.password = this.currentUrl.password;
    }
    else if(password===false){ //remove password
      this.urlParts.password = null;
    }
    else if(!type){ //getter
      return this.urlParts.password;
    }
    else{
      throw new Error('Password must be a string, boolean or undefined');
    }
    return this;
  };

  /** sets, unsets or gets the host
   * () - gets the host
   * (host {string}) - sets the host
   * (true {boolean}) - sets host to current host (from window.location.href)
   * (false {boolean}) - unsets the host
   */
  Url.prototype.host = function(host){
    var type = $x.type(host);
    if(type==='string'){ //string? set it then
      this.urlParts.host = $x.trimRight(host, '/');
    }
    else if(host===true){ //bool:true? then the current host will be used
      this.urlParts.host = this.currentUrl.host;
    }
    else if(host===false){ //bool:false? then remove host completely
      this.urlParts.host = null;
    }
    else if(!type){ //undefined? then it's a getter
      return this.urlParts.host;
    }
    else{
      throw new Error('$x.url.host: host must be a string, boolean or undefined');
    }
    return this;
  };

  /** sets, unsets or gets the port
   * () - gets the port
   * (port {integer}) - sets the port
   * (true {boolean}) - sets port to current port
   * (false {boolean}) - unsets the port
   */
  Url.prototype.port = function(port){
    var type = $x.type(port);
    if(type==='string' || type==='number'){ //setter
      this.urlParts.port = port;
    }
    else if(port===true){ //use current port from window.location.href
      this.urlParts.port = this.currentUrl.port;
    }
    else if(port===false){ //remove host
      this.urlParts.port = null;
    }
    else if(!type){ //getter
      return this.urlParts.port;
    }
    else{
      throw new Error('Port must be a string, number, boolean or undefined');
    }
    return this;
  };

  /** sets, unsets or gets the domain
   * () - gets the domain
   * (domain {string}) - sets the domain
   * (true {boolean}) - sets domain to current domain
   * (false {boolean}) - unsets the domain
   */
  Url.prototype.domain = function(domain){
    var _this = this;
    var overwriteDomainParts = function(domainParts){
      _this.urlParts.scheme = domainParts.scheme;
      _this.urlParts.username = domainParts.username;
      _this.urlParts.password = domainParts.password;
      _this.urlParts.host = domainParts.host;
      _this.urlParts.port = domainParts.port;
    };

    var type = $x.type(domain);
    if(type==='string'){ //string? set it then
      overwriteDomainParts($x.url(domain).urlParts);
    }
    else if(domain===true){ //bool:true? then the current domain will be used
      overwriteDomainParts(this.currentUrl.urlParts);
    }
    else if(domain===false){ //bool:false? then remove domain completely
      overwriteDomainParts(this._getBlankUrlPartsObject());
    }
    else if(!type){ //undefined? then it's a getter
      if(this.urlParts.scheme!==null){
        var domainStr = this.urlParts.scheme + '://';

        if(this.urlParts.host){
          if(this.urlParts.username){
            domainStr += this.urlParts.username;
            if(this.urlParts.password){
              domainStr += ':'+this.urlParts.password;
            }
            domainStr += '@';
          }

          domainStr += this.urlParts.host;

          if(this.urlParts.port){
            domainStr += ':'+this.urlParts.port;
          }
        }

        return domainStr;
      }
      else{
        return null;
      }
    }
    else{
      throw new Error('domain must be a string, boolean or undefined');
    }
    return this;
  };

  /** gets a segment or sets one or more URL segments
   * (index {integer}) - gets segment by index number
   * (index {integer}, value {string}) - sets segment at index to the value of the string
   * (value {string}) - appends segment from string (or multiple slash-separated segments)
   * (segments {array}) - appends multiple segments specified in an array at the end of the existing segments
   */
  Url.prototype.segment = function(){
    var arg0 = arguments[0];
    var arg0Type = $x.type(arg0);
    var arg1 = arguments[1];
    var arg1Type = $x.type(arg1);
    var offset;

    if(arg0Type==='number'){ //get/set segment by index
      if(arg1Type==='string'){ //setter
        this.urlParts.segments[arg0] = arg1;
      }
      else if(!arg1Type){ //getter
        offset = arg0<0 ? this.urlParts.segments.length + arg0 : arg0;
        return this.urlParts.segments[offset];
      }
      else{ //error
        throw new Error('incorrect type for argument 1');
      }
    }
    else if(arg0Type==='string'){ //append segment or multiple segments
      this.urlParts.segments = this.urlParts.segments.concat(arg0.split('/'));
    }
    else if(arg0Type==='array'){ //append multiple segments
      this.urlParts.segments = this.urlParts.segments.concat(arg0);
    }
    else{
      throw new Error('Argument 0 must be a number, string or an array');
    }
    return this;
  };

  /** inserts one or more segments before index
   * (index {integer}, segment {string}) - inserts segment at index
   * (index {integer}, segment {array}) - inserts multiple segments at index
   */
  Url.prototype.insertSegmentBefore = function(index, segment){
    var _this = this;
    var insertMultiple = function(segments){
      segments.reverse();
      for(var a=0,length=segments.length;a<length;a++){
        _this.urlParts.segments.splice(index, 0, segments[a]);
      }
    };

    var segmentType = $x.type(segment);

    if(segmentType==='string'){
      insertMultiple(segment.split('/'));
    }
    else if(segmentType==='array'){
      insertMultiple(segment);
    }
    return this;
  };

  /** unsets one or more segments
   * (index {integer}) - unsets segment at index
   * (indexes {array}) - unsets segments at indexes specified in the array
   */
  Url.prototype.unsetSegment = function(arg0){
    var arg0Type = $x.type(arg0);

    if(arg0Type==='number'){ //unset by index
      this.urlParts.segments.splice(arg0, 1);
    }
    else if(arg0Type==='array'){ //unset multiple by indexes
      //we need to unset the segments in a reversed order
      arg0.sort().reverse();
      for(var a=0,length=arg0.length;a<length;a++){
        this.urlParts.segments.splice(arg0[a], 1);
      }
    }
    else{
      throw new Error('Argument 0 must be a number');
    }
    return this;
  };

  /** unsets all segments
   */
  Url.prototype.unsetAllSegments = function(){
    this.urlParts.segments = [];

    return this;
  };

  /** gets a param or sets one or more URL params
   * (key {string}) - gets param by key
   * (key {string}, value {string}) - sets param's value
   * (params {object}) - sets multiple params
   */
  Url.prototype.param = function(){
    var arg0 = arguments[0];
    var arg0Type = $x.type(arg0);
    var arg1 = arguments[1];
    var arg1Type = $x.type(arg1);

    if(arg0Type==='string'){ //get/set param
      if(arg1Type==='string'){ //setter
        this.urlParts.params[arg0] = arg1;
      }
      else{ //getter
        return this.urlParts.params[arg0];
      }
    }
    else if(arg0Type==='object'){ //set multiple params
      this.urlParts.params = $x.merge(this.urlParts.params, arg0);
    }
    else{
      throw new Error('Argument 0 must be a string or an object');
    }
    return this;
  };

  /** unsets one or more params
   * (key {string}) - unsets param
   * (keys {array}) - unsets all params specified in the array
   */
  Url.prototype.unsetParam = function(arg0){
    var type = $x.type(arg0);
    if(type==='string'){ //delete one by name
      delete(this.urlParts.params[arg0]);
    }
    else if(type==='array'){ //delete multiple by array of strings (key names)
      for(var a=0,length=arg0.length;a<length;a++){
        delete(this.urlParts.params[arg0[a]]);
      }
    }
    return this;
  };

  /** unsets all params
   */
  Url.prototype.unsetAllParams = function(){
    this.urlParts.params = {};

    return this;
  };

  /** sets, unsets or gets the partial
   * () - gets the partial
   * (partial {string}) - sets the partial
   * (true {boolean}) - sets partial to current partial (from window.location.href)
   * (false {boolean}) - unsets the partial
   */
  Url.prototype.partial = function(partial){
    var type = $x.type(partial);
    if(type==='string'){ //setter
      this.urlParts.partial = partial;
    }
    else if(partial===true){ //use current scheme from window.location.href
      this.urlParts.partial = this.currentUrl.partial;
    }
    else if(partial===false){ //remove partial
      this.urlParts.partial = null;
    }
    else if(!type){ //getter
      return this.urlParts.partial;
    }
    else{
      throw new Error('Partial must be a string, boolean or undefined');
    }
    return this;
  };

  /** redirects to this url
   */
  Url.prototype.go = function(){
    window.location.href = this.get();
  };

  /** clones the url objects and returns the new instance
  */
  Url.prototype.clone = function(){
    return $x.url(this.urlParts);
  };

  return function(url){
    if(url instanceof Url){ return url; }
    else{ return new Url(url); }
  };
}());
/*jslint nomen: true, plusplus: true, vars: true, browser: true */
/*global $, jQuery, $x*/

//!!! TODO: remove browser-specific functionality as soon as all modern browsers support W3C
//!!! TODO: remove the reliance on jquery...

(function(){
  'use strict';

  if(!$x.api){ $x.api = {}; }

  $x.api.fullscreen = (function(){
    var isAvailable = function(){
      return (document.body.requestFullScreen || document.body.webkitRequestFullScreen || document.body.mozRequestFullScreen);
    };

    var request = function(element){
      if(element instanceof jQuery){ element = element.get(0); }

      if(element.requestFullScreen){ element.requestFullScreen(); }
      else if(element.webkitRequestFullScreen){ element.webkitRequestFullScreen(); }
      else if(element.mozRequestFullScreen){ element.mozRequestFullScreen(); }
    };

    var cancel = function(){
      if(document.cancelFullScreen){ document.cancelFullScreen(); }
      else if(document.webkitCancelFullScreen){ document.webkitCancelFullScreen(); }
      else if(document.mozCancelFullScreen){ document.mozCancelFullScreen(); }
    };

    var isOn = function(){
      return (document.fullScreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) ? true : false;
    };

    var onchange = function(callback){
      $(document).bind('fullscreenchange mozfullscreenchange webkitfullscreenchange', callback);
    };

    var onexit = function(callback){
      $(document).bind('fullscreenchange mozfullscreenchange webkitfullscreenchange', function(){
        if(!isOn()){ callback(); }
      });
    };

    var onenter = function(callback){
      $(document).bind('fullscreenchange mozfullscreenchange webkitfullscreenchange', function(){
        if(isOn()){ callback(); }
      });
    };

    return {
      isAvailable : isAvailable,
      isOn : isOn,
      request : request,
      cancel : cancel,
      onchange : onchange,
      onexit : onexit,
      onenter : onenter

    };
  }());
}());
(function($x){
  "use strict";
  window.$x.widget = {};
}(window.$x));
/*jslint nomen: true, plusplus: true, vars: true, browser: true */

/** TODO:
 * - x.date - standarize the way all the methods work when date is not set
 * - config.maxDaySpan isn't used at all
 * - config.containerClassName isn't used
 * - config.container/containerStart/containerEnd aren't used
 * To be tested:
 * - single input calendar
 */

(function($x){
  'use strict';

  $x.widget.calendar = (function(){

    var baseClassName = 'x-calendar';
    var currentInstance = null;
    var calendarContainer; //calendar's container element
    var maxMonths = 12;
    var inited = false;

    var defaultConfig = {
      startDateInput : null, //start date input
      endDateInput : null, //end date input
      minDate : $x.date(true), //minimum date as $x.date object (defaults to today's date)
      maxDate : $x.date(true), //maximum date as $x.date object (defaults to minDate + minDaySpan)
      minDaySpan : 1, //minimum number of days between the start date and end date
      maxDaySpan : 1, //maximum number of days between the start date and end date
      totalMonths : 2, //number of months to be displayed at once
      monthsPerRow : 4, //number of months to be displayed per row
      selectionType : 'day', //type of selection [day/week]
      firstDayOfWeek : 1, //first day of week (1=Mon, 7=Sun)
      monthLabels : [null, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], // names of months
      dayLabels : [null, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], //names of days of week
      containerClassName : '', //extra class name for the outer-most container (apart from the baseClassName)
      container : null, //the container that will be used to append the calendar to (for both start and end date inputs)
      containerStart : null, //if set, the start input will use its own container
      containerEnd : null, //if set, the end input will use its own container
      dateFormat : 'dmY' //date format compatible with $x.date. Can be dmy,mdy,ymd
    };

    /** Initializes the calendar
     */
    var _init = function(){
      if(inited){ return false; }
      inited = true;

      /** Creates the DOM structure for the calendar. All instances of the calendar reuse the same calendar container
       */
      var _createCalendarStructure = function(){
        calendarContainer = $x.el('div', { className : baseClassName }, [
          $x.el('div', {className : 'calendarInner'}, [
            $x.el('div', {className : 'header clearfix'}, [
              $x.el('div', {className : 'left'}, [
                $x.el('span', {className : 'button navLeft1'}, '&laquo;'),
                $x.el('span', {className : 'button navLeft2'}, '&lsaquo;')
              ]),
              $x.el('div', {className : 'middle'}, [
                $x.el('span', {className : 'button current'}, 'Current')
              ]),
              $x.el('div', {className : 'right'}, [
                $x.el('span', {className : 'button navRight2'}, '&rsaquo;'),
                $x.el('span', {className : 'button navRight1'}, '&raquo;')
              ])
            ]),
            $x.el('ul', {className : 'months'}, (function(){
              var months = [];

              var clickHandler = function(e){
                currentInstance.updateSelection(e.target);
              };

              var hoverHandler = function(e){
                if($x.hasClass(e.currentTarget, 'selectable')){
                  currentInstance.updateSelection(e.currentTarget, true);
                }
              };

              for(var a=1;a<=maxMonths;a++){
                var days = [];
                var daysOfWeek = [];

                var dow_counter = 1; //day of week counter

                var b;

                for(b=1;b<=42;b++){
                  if(dow_counter>7){ dow_counter = 1; }
                  var className = 'day';
                  if(dow_counter===6){ className += ' saturday weekend'; }
                  else if(dow_counter===7){ className += ' sunday weekend'; }
                  else { className += ' weekday'; }

                  var dayEl = $x.el('li', {className : className}, [
                  ]);

                  $x.addEvent(dayEl, 'click', clickHandler);

                  $x.addEvent(dayEl, 'mouseover', hoverHandler);

                  days.push(dayEl);

                  dow_counter++;
                }

                for(b=1;b<=7;b++){
                  daysOfWeek.push($x.el('li', {className : 'dow'}));
                }

                months.push(
                  $x.el('li', {className : 'month month'+a}, [
                    $x.el('div', {className : 'monthBar'}, [
                      $x.el('span', {className : 'label'})
                    ]),
                    $x.el('ul', {className : 'days_of_week'}, daysOfWeek),
                    $x.el('ul', {className : 'days'}, days)
                  ])
                );
              }

              return months;
            }())),
            $x.el('div', {className : 'footer'}, [
              $x.el('span', {className : 'counter'}, [
              ])
            ])
          ])
        ]);
        $x.append(calendarContainer);
        $x.addEvent(calendarContainer, 'mouseout', function(e){
          if(!$x.isWithin(e.relatedTarget, calendarContainer)){
            currentInstance.updateSelection();
          }
        });

        $x.addEvent($x.get1('div.header span.navLeft1', calendarContainer), 'click', function(){
          currentInstance.navigateLeftLong();
        });
        $x.addEvent($x.get1('div.header span.navLeft2', calendarContainer), 'click', function(){
          currentInstance.navigateLeftShort();
        });
        $x.addEvent($x.get1('div.header span.navRight1', calendarContainer), 'click', function(){
          currentInstance.navigateRightLong();
        });
        $x.addEvent($x.get1('div.header span.navRight2', calendarContainer), 'click', function(){
          currentInstance.navigateRightShort();
        });
        $x.addEvent($x.get1('div.header span.current', calendarContainer), 'click', function(){
          currentInstance.navigateToCurrent();
        });
      };

      //add window click event to close the calendar when clicked outside
      $x.addEvent('click', function(e){
        if(!$x.hasClass(calendarContainer, 'opened')){ return; } //dont do anything if the calendar is not opened
        if(!$x.isWithin(e.target, calendarContainer) &&
           !$x.isWithin(e.target, currentInstance.config[currentInstance.mode+'DateInput'])){ currentInstance.close(); }
      });

      _createCalendarStructure();

      return true;
    };

    var Calendar = function(config){
      var This = this;
      _init();
      this.config = $x.merge(defaultConfig, config);

      //get references to the inputs
      this.config.startDateInput = $x.get1(this.config.startDateInput);
      if(this.config.endDateInput){ this.config.endDateInput = $x.get1(this.config.endDateInput); }

      //calculate some missing default values for config properties
      this.config.minDate = this.config.minDate.isSet() ? $x.date(this.config.minDate) : $x.date(true);
      this.config.maxDate = this.config.maxDate.isSet() ? $x.date(this.config.maxDate) : this.config.minDate.isSet() ? this.config.minDate.clone().shift(this.config.minDaySpan) : $x.date(true);
      if(this.config.container){ this.config.container = $x.get1(this.config.container); }
      this.config.containerStart = $x.get1(this.config.containerStart) || this.config.container || this.config.startDateInput.parentNode;
      this.config.containerEnd = $x.get1(this.config.containerEnd) || this.config.container || this.config.endDateInput.parentNode;

      //validate the config properties
      if(this.config.minDate.isSet() && this.config.minDate.greaterEqual(this.config.maxDate)){ $x.error('$x.widget.calendar: "config[maxDate]" must be greater than "config[minDate]"', 2, this.config); }
      if(this.config.maxDaySpan < this.config.minDaySpan){ $x.error('$x.widget.calendar: "config[maxDaySpan]" must be greater than "config[minDaySpan]"', 2, this.config); }
      if(!/^day|week$/.test(this.config.selectionType)){ $x.error('$x.widget.calendar: "config[selectionType]" must be either "day" or "week"', 2, this.config); }
      if(this.config.totalMonths>maxMonths){ $x.error('$x.widget.calendar: config[totalMonths] cannot be greater than '+maxMonths, 2, this.config.totalMonths); }

      //the dates get populated when calendar is opened
      this.startDate = $x.date(true);
      this.endDate = $x.date(true);

      //add events
      $x.addEvent(this.config.startDateInput, 'focus', function(e){
        This.open('start');
      });

      if(this.config.endDateInput){
        $x.addEvent(this.config.endDateInput, 'focus', function(e){
          This.open('end');
        });
      }

      this.mode = null; //this can be either 'start' or 'end' and is set by this.open() based on the dateType argument
      this.lastHoverEventElement = null;
    };

    Calendar.prototype.navigateLeftLong = function(){ this._navigate('left', 'long'); };
    Calendar.prototype.navigateLeftShort = function(){ this._navigate('left', 'short'); };
    Calendar.prototype.navigateRightLong = function(){ this._navigate('right', 'long'); };
    Calendar.prototype.navigateRightShort = function(){ this._navigate('right', 'short'); };
    Calendar.prototype.navigateToCurrent = function(){ this._navigate('current'); };

    Calendar.prototype._navigate = function(type, length){
      var firstDayEl = $x.get1('li.day:not(.blank)', calendarContainer); //first day cell (one that actually contains a day number)
      var date = this.getDateFromDayEl(firstDayEl); //first visible date on the calendar

      if(type==='left'){
        if(length==='long'){
          date.shift(0, 0, -1);
        }
        else if(length==='short'){
          date.shift(0, -1);
        }
        this.open(this.mode, date);
      }
      else if(type==='right'){
        if(length==='long'){
          date.shift(0, 0, 1);
        }
        else if(length==='short'){
          date.shift(0, 1);
        }
        this.open(this.mode, date);
      }
      else if(type==='current'){
        this.open(this.mode);
      }
    };

    Calendar.prototype.calculateFirstMonth = function(dateType){
      if(dateType==='start'){
        if(this.startDate.isSet()){
          return $x.date({
            d : 1,
            m : this.startDate.month(),
            y : this.startDate.year()
          });
        }
        else{
          return $x.date({
            d : 1,
            m : $x.date(true).month(),
            y : $x.date(true).year()
          });
        }
      }
      else{ //type==='end'
        var startDate = this.calculateFirstMonth('start'); //starting point - startDate month
        if(this.endDate && this.endDate.isSet()){ //if we have a valid end date in the field
          if(this.endDate.monthDiff(startDate)>this.config.totalMonths){ //if the difference between the dates is more than totalMonths months then set the startMonth to endDate month - totalMonths
            return this.endDate.clone().shift(0, -this.config.totalMonths+1);
          }
        }
        return startDate;
      }
    };

    /** fills the calendar with days starting from startDate month
     */
    Calendar.prototype.fill = function(startDate){
      var This = this;
      var a, b, monthEl;
      var todayDateStr = $x.date(true).format('Ymd');

      /* hide all month divs that we dont want to show */
      for(a=1;a<=maxMonths;a++){
        monthEl = $x.get1('li.month'+a, calendarContainer);
        $x.removeAttr(monthEl, 'x-date'); //remove the date attribute

        if(a>this.config.totalMonths){
          $x.addClass(monthEl, 'hidden');
        }
        else{
          $x.removeClass(monthEl, 'hidden');
        }

        if((a-1) % this.config.monthsPerRow){
          $x.removeClass(monthEl, 'clear');
        }
        else{
          $x.addClass(monthEl, 'clear');
        }
      }

      /* fill all month cells with data */
      var minDateStr = this.config.minDate.isSet() ? this.config.minDate.format('Ymd') : null;
      var maxDateStr = this.config.maxDate.isSet() ? this.config.maxDate.format('Ymd') : null;

      for(a=1;a<=this.config.totalMonths;a++){
        monthEl = $x.get1('li.month'+a, calendarContainer);
        var monthFirstDate = startDate.clone().shift(0, a-1);
        var monthLastDate = startDate.clone().shift(-1, a);
        var dow1st = monthFirstDate.dayOfWeek();
        var daysInMonth = monthFirstDate.daysInMonth();
        var daysOfWeekEl = $x.get('li.dow', monthEl);
        var daysEls = $x.get('li.day', monthEl);
        var monthLabelEl = $x.get1('div.monthBar span.label', monthEl);
        var thisMonthDateStr = monthFirstDate.format('Ymd').substr(0, 6); //year and month as string, i.e. YYYYMM

        /* add month label */
        $x.text(monthLabelEl, this.config.monthLabels[monthFirstDate.month()] + ' ' + monthFirstDate.year());

        /* add date attribute */
        $x.attr(monthEl, 'x-date', thisMonthDateStr);

        /* add days of week labels */
        for(b=1;b<=7;b++){
          $x.text(daysOfWeekEl[b-1], this.config.dayLabels[b].substr(0, 2));
        }

        /* add days of month */
        var dayCounter = 0;
        var startFrom = (daysInMonth===28 && dow1st===1) ? 8 : dow1st;
        for(b=1;b<=42;b++){
          var dayEl = daysEls[b-1];
          var label;

          $x.removeClass(dayEl, 'blank out_of_range selectable start end highlighted today');

          if(b>=startFrom && b<startFrom+daysInMonth){
            label = ++dayCounter;
            var dayCounterPadded = $x.pad(dayCounter, '0', 2);
            var thisDayDateStr = thisMonthDateStr+dayCounterPadded;

            if(minDateStr && minDateStr>thisDayDateStr || maxDateStr && maxDateStr<thisDayDateStr){
              $x.addClass(dayEl, 'out_of_range');
            }
            else{
              $x.addClass(dayEl, 'selectable');
            }
            if(thisDayDateStr===todayDateStr){
              $x.addClass(dayEl, 'today');
            }
            $x.attr(dayEl, 'x-day', dayCounter);
          }
          else{
            label = '';
            $x.addClass(dayEl, 'blank');
            $x.removeAttr(dayEl, 'x-day');
          }

          $x.text(dayEl, label);
        }


      }

    };

    Calendar.prototype.open = function(dateType, customDate){
      currentInstance = this;
      this.mode = dateType;
      this.lastHoverEventElement = null;

      this.updateDateObjects();

      if(customDate){
        this.fill(customDate);
      }
      else{
        this.fill(this.calculateFirstMonth(this.mode));
      }

      //append to the specified container
      if(this.mode==='start'){ $x.append(calendarContainer, this.config.containerStart); }
      else if(this.mode==='end'){ $x.append(calendarContainer, this.config.containerEnd); }

      //unhide
      $x.addClass(calendarContainer, 'opened '+this.mode);


      this.updateSelection();
    };

    Calendar.prototype.close = function(){
      $x.removeClass(calendarContainer, 'opened'); //hide
    };


    /** updates date objects based on values of the date inputs
     * //!!! TODO: the inputs should have an event attached to them and this method should be bound to that element for that event
     */
    Calendar.prototype.updateDateObjects = function(){
      this.startDate = $x.date(this.config.startDateInput.value, this.config.dateSeparator, this.config.dateFormat) || $x.date(true);
      this.endDate = (this.config.endDateInput) ? $x.date(this.config.endDateInput.value, this.config.dateSeparator, this.config.dateFormat) : $x.date(true);
    };

    Calendar.prototype.getDayElByDate = function(date){
      if(!date || !date.isSet()){ return null; }
      var dateObj = date.getDateObject();
      return $x.get1('[x-date="'+dateObj.y + $x.pad(dateObj.m, '0', 2)+'"] [x-day="'+dateObj.d+'"]', calendarContainer);
    };

    Calendar.prototype.getDateFromDayEl = function(dayEl){
      if(!dayEl){ return null; }
      var ymStr = $x.attr(dayEl.parentNode.parentNode, 'x-date');
      return $x.date({
        y : ymStr.substr(0, 4),
        m : ymStr.substr(4, 2),
        d : $x.text(dayEl)
      });
    };

    Calendar.prototype.getStartDateDayEl = function(){
      return $x.get1('li.day.selectable.start', calendarContainer);
    };

    Calendar.prototype.getEndDateDayEl = function(){
      return $x.get1('li.day.selectable.end', calendarContainer);
    };

    /** selects date
     */
    Calendar.prototype.updateSelection = function(dayEl, temporary){
      var startDate, endDate;
      var startCell, endCell;
      var shiftedDate, shiftedDateCell;

      if(dayEl){
        if(this.mode==='start'){
          startDate = $x.date(this.getDateFromDayEl(dayEl));
          startDate = this.adjustDate('start', startDate);
          shiftedDate = startDate.clone().shift(this.config.minDaySpan);
          endDate = $x.date(this.endDate).clone();

          if(this.config.minDate.isSet() && startDate.lower(this.config.minDate)){ return; }
          if(shiftedDate && this.config.maxDate.isSet() && shiftedDate.greater(this.config.maxDate)){ return; }

          if(this.config.selectionType==='week'){
            var nextSundayDate = this.adjustDate('end', startDate.clone());
            if(nextSundayDate && this.config.maxDate.isSet() && nextSundayDate .greater(this.config.maxDate)){ return; }
          }
        }
        else{ /* ='end' */
          endDate = $x.date(this.getDateFromDayEl(dayEl));
          endDate = this.adjustDate('end', endDate);
          shiftedDate = endDate.clone().shift(-this.config.minDaySpan);
          startDate = $x.date(this.startDate).clone();

          if(this.config.maxDate.isSet() && endDate.greater(this.config.maxDate)){ return; }
          if(shiftedDate && this.config.minDate.isSet() && shiftedDate.lower(this.config.minDate)){ return; }

          if(this.config.selectionType==='week'){
            var previousMondayDate = this.adjustDate('start', endDate.clone());
            if(previousMondayDate && this.config.minDate.isSet() && previousMondayDate.lower(this.config.minDate)){ return; }
          }
        }

        if(startDate.isSet() && endDate.isSet() && !this.isStillCorrectDate(startDate, endDate, this.mode)){
          if(this.mode==='start'){
            if(!temporary){
              this.unsetDate('end');
            }
            endDate.unset();
          }
          else{
            if(!temporary){
              this.unsetDate('start');
            }
            startDate.unset();
          }
        }
        if(!temporary){ /* e.g. on click */
          if(this.mode==='start'){
            if(startDate){
              this.setDate('start', startDate);
            }
          }
          else if(this.mode==='end'){
            if(endDate){
              this.setDate('end', endDate);
            }
          }
          this.close();
        }


        this.makeSelection(startDate, endDate);
      }
      else{ /* no day el - e.g. on mouseout (the original selection needs to be restored) */
        startDate = $x.date(this.startDate).clone();
        endDate = $x.date(this.endDate).clone();
        this.makeSelection(startDate, endDate);
      }
    };

    /** adjusts the selected date when in week selection mode
    */
    Calendar.prototype.adjustDate = function(mode, date){
      if(this.config.selectionType!=='week'){ return date; }

      if(mode==='start'){
        date.shift(-date.dayOfWeek()+1);
      }
      else{ //'end'
        date.shift(7-date.dayOfWeek());
      }
      return date;
    };

    Calendar.prototype.unsetDate = function(mode){
      if(mode==='start'){
        this.startDate = $x.date(true);
        this.config.startDateInput.value = '';
      }
      else{
        this.endDate = $x.date(true);
        this.config.endDateInput.value = '';
      }
    };

    /** sets the value of the date input element and updates the cached date object
     */
    Calendar.prototype.setDate = function(mode, date){
      var dateStr = date.format(this.config.dateFormat);

      if(this.mode==='start'){
        this.startDate = date.clone();
        this.config.startDateInput.value = dateStr;
      }
      else{
        this.endDate = date.clone();
        this.config.endDateInput.value = dateStr;
      }
    };

    /** makes sure that the other date is still correct after choosing the subject date. If it's not valid then the other date gets unset
     */
    Calendar.prototype.isStillCorrectDate = function(startDate, endDate, mode){
      if(!startDate.isSet() || !endDate.isSet()){ return true; } //if either date isnt set that means that the date cannot be incorrect
      if(mode==='start'){
        return (endDate.greaterEqual(startDate)); //returns false when startDate is greater than or equal to endDate
      }
      else{ /* mode==='end' */
        return (startDate.lowerEqual(endDate)); //returns false when endDate is lower than or equal to startDate
      }
    };

    /** makes a visual selection based on startDate and endDate arguments
     */
    Calendar.prototype.makeSelection = function(startDate, endDate){
      var selectedStartDate = $x.date(this.getDateFromDayEl(this.getStartDateDayEl()));
      var selectedEndDate = $x.date(this.getDateFromDayEl(this.getEndDateDayEl()));
      var startDateSet = startDate ? startDate.isSet() : false;
      var endDateSet = endDate ? endDate.isSet() : false;

      if(
        (!startDate || startDateSet && selectedStartDate.isSet() && startDate.equal(selectedStartDate)) &&
        (!endDate || endDateSet && selectedEndDate.isSet() && endDate.equal(selectedEndDate)))
      {
        return;
      }

      //update counter
      var counter = $x.get1('span.counter', calendarContainer);
      var diff = 'N/A';
      if(startDateSet && endDateSet){
        diff = Math.ceil(endDate.dayDiff(startDate));
        if(this.config.selectionType==='week'){
          diff = Math.ceil(diff/7);
        }
        else{
          diff += 1;
        }
      }
      $x.text(counter, 'Number of '+this.config.selectionType+'s: '+diff);

      //mark and highlight
      this.mark(startDate, endDate);
      this.highlight(startDate, endDate);
    };

    Calendar.prototype.mark = function(startDate, endDate){
      var startDateSet = startDate ? startDate.isSet() : false;
      var endDateSet = endDate ? endDate.isSet() : false;

      //clear markers
      var dayStartEls = $x.get('li.day.start', calendarContainer);
      var dayEndEls = $x.get('li.day.end', calendarContainer);

      var a;

      for(a=0;a<dayStartEls.length;a++){
        $x.removeClass(dayStartEls[a], 'start');
      }
      for(a=0;a<dayEndEls.length;a++){
        $x.removeClass(dayEndEls[a], 'end');
      }

      //mark days to represent the dates in inputs
      var ymd, ym;
      var dayEl;

      if(startDateSet){
        dayEl = this.getDayElByDate(startDate);
        if(dayEl){
          $x.addClass(dayEl, 'start');
        }
      }
      if(endDateSet){
        dayEl = this.getDayElByDate(endDate);
        if(dayEl){
          $x.addClass(dayEl, 'end');
        }
      }
    };

    Calendar.prototype.highlight = function(startDate, endDate){
      var startDateSet = startDate ? startDate.isSet() : false;
      var endDateSet = endDate ? endDate.isSet() : false;
      var dayEls;
      var a, l;

      if(!startDateSet || !endDateSet){
        //remove highlight
        dayEls = $x.get('li.day.highlighted', calendarContainer);
        for(a=0,l=dayEls.length; a<l; a++){
          $x.removeClass(dayEls[a], 'highlighted');
        }
      }
      else{
        dayEls = $x.get('li.day.selectable', calendarContainer);

        var firstVisibleDate = this.getDateFromDayEl(dayEls[0]);
        var lastVisibleDate = this.getDateFromDayEl(dayEls[dayEls.length-1]);

        var highlighterOn = firstVisibleDate.greater(startDate);

        var firstToHighlight = this.getDayElByDate(startDate);
        var lastToHighlight = this.getDayElByDate(endDate);

        var dayEl;

        for(a=0,l=dayEls.length; a<l; a++){
          dayEl = dayEls[a];
          if(!highlighterOn){
            if(dayEl===firstToHighlight){
              highlighterOn = true;
            }
          }

          if(highlighterOn){
            $x.addClass(dayEl, 'highlighted');
            if(dayEl===lastToHighlight){ highlighterOn = false; }
          }
          else{
            $x.removeClass(dayEl, 'highlighted');
          }
        }
      }
    };

    return function(config){
      return new Calendar(config);
    };
  }());
}(window.$x));
/*jslint nomen: true, plusplus: true, vars: true, browser: true */

(function($x){
  'use strict';

  $x.widget.calendar = (function(){

    var $calendar = null;
    var $counterLabel = null;
    var $counterValue = null;
    var baseClass = '-x-calendar';
    var maxMonths = 12;
    var inited = false;
    var currentInstance = null;
    var monthLabels = [null, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var dayLabels = [null, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    var defaultConfig = {
      $startDate: null, //start date input element or selector. This property is required
      $endDate: null, //end date input element or selector
      $container: null, //container to append the calendar to for start date. defaults to $startDate.parentNode
      $containerEnd: null, //if set, the end input will use its own container, otherwise it will use the $container
      calendarExtraClass: '', //extra class name for the $calendar (doesn't override the baseClass)
      minDate: null, //minimum date as $x.date object or null for no minimum (defaults to today's date)
      maxDate: null, //maximum date as $x.date object or null for no maximum (defaults to minDate + minDiff)
      minDiff: 1, //minimum number of days (weeks in week selection type) between the start date and end date
      maxDiff: null, //maximum number of days (weeks in week selection type) between the start date and end date
      length: 2, //number of months to be shown on the calendar
      monthsPerRow: 4, //number of months to be displayed per row
      selectionType: 'day', //type of selection [day/week]
      firstDayOfWeek: 1, //first day of week (1: Monday is first day, 0: Sunday is first day)
      inFormat: 'dmy',
      inFormatSeparator: '/', //inFormat and inSeparator will be redundant in the future and outFormat will become simply dateFormat for both input and output
      outFormat: 'd/m/Y'
    };

    /* assembles the calendar
     */
    var init = function(){
      if(inited){ return; }
      inited = true;

      var generateMonths = function(){
        var months = [];
        var a, b;

        var mark = function(e){
          var $this = e.target;

          var date = currentInstance.getDateByCell($this);

          if(date){
            currentInstance.mark(date, currentInstance.mode);
            currentInstance.close();
          }
        };

        var highlight = function(e){
          var $this = e.target;

          if(!$x.hasClass($this, '-x-selectable')){ return; }

          var startDate;
          var endDate;

          if(currentInstance.mode==='start'){
            startDate = currentInstance.getDateByCell($this);
            endDate = currentInstance.getEndDate();
          }
          else{
            startDate = currentInstance.getStartDate();
            endDate = currentInstance.getDateByCell($this);
          }

          currentInstance.updateSelection(startDate, endDate, true);
        };

        for(a=1;a<=maxMonths;a++){
          var days = [];
          var daysOfWeek = [];

          var dow_counter = 1; //day of week counter

          for(b=1;b<=7;b++){
            daysOfWeek.push($x.el('li', {className: '-x-dow'}, dayLabels[b].substr(0, 2)));
          }

          for(b=1;b<=42;b++){
            if(dow_counter>7){ dow_counter = 1; }

            var className = ['-x-day'];
            if(dow_counter>=6){
              className.push('-x-weekend');
              className.push(dow_counter===6 ? '-x-saturday' : '-x-sunday');
            }
            else {
              className.push('-x-weekday');
            }

            var dayEl = $x.el('li', {className: className}, [
            ]);

            $x.addEvent(dayEl, 'mouseenter', highlight);

            $x.addEvent(dayEl, 'click', mark);

            days.push(dayEl);

            dow_counter++;
          }

          months.push(
            $x.el('li', {className: '-x-month -x-month'+a}, [
              $x.el('div', {className: '-x-month-bar'}, [
                $x.el('span', {className: '-x-label'})
              ]),
              $x.el('ul', {className: '-x-days-of-week'}, daysOfWeek),
              $x.el('ul', {className: '-x-days'}, days)
            ])
          );
        }

        return months;
      };

      $calendar = $x.el('div', { className: baseClass }, [
        $x.el('div', {className: '-x-calendar-inner'}, [
          $x.el('div', {className: '-x-header -x-clearfix'}, [
            $x.el('div', {className: '-x-left'}, [
              $x.el('span', {className: '-x-button -x-nav-left -x-long'}, '&laquo;'),
              $x.el('span', {className: '-x-button -x-nav-left -x-short'}, '&lsaquo;')
            ]),
            $x.el('div', {className: '-x-middle'}, [
              $x.el('span', {className: '-x-button -x-current'}, 'Current')
            ]),
            $x.el('div', {className: '-x-right'}, [
              $x.el('span', {className: '-x-button -x-nav-right -x-short'}, '&rsaquo;'),
              $x.el('span', {className: '-x-button -x-nav-right -x-long'}, '&raquo;')
            ]),
            $x.el('span', {className: '-x-button -x-close'}, '&#10006;')
          ]),
          $x.el('ul', {className: '-x-months'}, generateMonths()),
          $x.el('div', {className: '-x-footer'}, [
            $x.el('div', {className: '-x-counter'}, [
              $x.el('span', {className: '-x-label'}),
              $x.el('span', {className: '-x-value'})
            ])
          ])
        ])
      ]);

      $x.append($calendar);

      $counterLabel = $x.get1('.-x-counter .-x-label', $calendar);
      $counterValue = $x.get1('.-x-counter .-x-value', $calendar);

      $x.addEvent($calendar, 'mouseleave', function(){
        currentInstance.updateSelection();
      });

      $x.addEvent($calendar, 'mouseleave', function(){
        currentInstance.updateSelection();
      });

      $x.addEvent(document, 'click', function(){
        if(currentInstance){
          currentInstance.close();
        }
      });

      $x.addEvent($calendar, 'click', function(e){
        e.stopPropagation();
      });

      //navigation
      $x.addEvent($x.get1('.-x-nav-left.-x-long', $calendar), 'click', function(){
        currentInstance.navigate('left', 'long');
      });
      $x.addEvent($x.get1('.-x-nav-left.-x-short', $calendar), 'click', function(){
        currentInstance.navigate('left', 'short');
      });
      $x.addEvent($x.get1('.-x-button.-x-current', $calendar), 'click', function(){
        currentInstance.navigate('current');
      });
      $x.addEvent($x.get1('.-x-nav-right.-x-short', $calendar), 'click', function(){
        currentInstance.navigate('right', 'short');
      });
      $x.addEvent($x.get1('.-x-nav-right.-x-long', $calendar), 'click', function(){
        currentInstance.navigate('right', 'long');
      });

      //close button
      $x.addEvent($x.get1('.-x-button.-x-close', $calendar), 'click', function(){
        currentInstance.close();
      });
    };

    /** creates a new calendar instance
     */
    var Calendar = function(config){
      init();
      var _this = this;
      this.config = $x.merge(defaultConfig, config);

      this.single = this.config.$endDate ? false : true; //whether it's a single or a double calendar (start date or start date + end date)
      this.opened = false; //whether the calendar is opened
      this.calendarDate = null;


      //initial validation
      if(!this.config.$startDate){
        throw new Error('$startDate is a required property');
      }

      //normalize config values
      this.config.$startDate = $x.get1(this.config.$startDate);
      this.config.$container = $x.get1(this.config.$container) || this.config.$startDate.parentNode;
      if(this.config.length>maxMonths){ this.config.length = maxMonths; }

      if(!this.single){
        this.config.$endDate = $x.get1(this.config.$endDate);
        this.config.$containerEnd = $x.get1(this.config.$containerEnd) || this.config.$container;
      }

      if(this.config.selectionType==='week'){
        var dow;
        if(this.config.minDate){ //set min date to next Monday
          dow = this.config.minDate.dayOfWeek();
          if(dow!==1){
            this.config.minDate.shift(8-dow);
          }
        }
        if(this.config.maxDate){ //set min date to previous Sunday
          dow = this.config.maxDate.dayOfWeek();
          if(dow!==7){
            this.config.maxDate.shift(-dow);
          }
        }

        if(this.config.minDiff===0){ this.config.minDiff = 1; }
        if(this.config.maxDiff===0){ this.config.maxDiff = 1; }
        this.config.minDiff = (this.config.minDiff * 7) - 7;
        if(this.config.maxDiff){
          this.config.maxDiff = (this.config.maxDiff * 7) - 1;
        }
      }


      //final validation
      if(!this.config.$startDate){
        throw new Error('$startDate is not a valid element/selector');
      }
      if(!/^day|week$/.test(this.config.selectionType)){
        throw new Error('selectionType must be "day" or "week"');
      }
      if(!this.single){
        if(!this.config.$endDate){
          throw new Error('$x.widget.calendar: $endDate is not a valid element/selector');
        }
      }

      //attach events
      $x.addEvent('focus', this.config.$startDate, function(){
        _this.open('start');
      });

      $x.addEvent('keypress', this.config.$startDate, function(e){
        var keys = $x.keysPressed(e, true);
        if(keys==='TAB' || keys==='SHIFT+TAB' || keys==='ESCAPE'){
          _this.close();
        }
      });

      $x.addEvent('click', this.config.$startDate, function(e){
        e.stopPropagation();
      });

      $x.addEvent('change', this.config.$startDate, function(){
        _this.startDate = _this.getInputDate('start');
        _this.populate();
      });

      if(!this.single){
        $x.addEvent('focus', this.config.$endDate, function(){
          _this.open('end');
        });

        $x.addEvent('keypress', this.config.$endDate, function(e){
          var keys = $x.keysPressed(e, true);
          if(keys==='TAB' || keys==='SHIFT+TAB' || keys==='ESCAPE'){
            _this.close();
          }
        });

        $x.addEvent('click', this.config.$endDate, function(e){
          e.stopPropagation();
        });

        $x.addEvent('change', this.config.$endDate, function(){
          _this.endDate = _this.getInputDate('end');
          _this.populate();
        });
      }
    };

    Calendar.prototype = {
      /** opens calendar in specified mode
       * @param {String} mode (start|end) calendar mode
       */
      open: function(mode){
        //close current instance if opened
        if(currentInstance){
          currentInstance.close();
        }

        //setup
        currentInstance = this;
        this.opened = true;
        this.mode = mode; //(start|end) whether it's a calendar for start date or end date
        this.startDate = this.getInputDate('start'); //date from the start input
        this.endDate = this.getInputDate('end'); //date from the end input

        this.populate();

        $x.text($counterLabel, this.config.selectionType==='day' ? 'days' : 'weeks');

        $x.append($calendar, this.mode==='start' ? this.config.$container : this.config.$containerEnd);

        $x.addClass($calendar, '-x-opened ' + this.config.calendarExtraClass);
      },

      /** closes calendar
       */
      close: function(){
        $x.removeClass($calendar, '-x-opened ' + this.config.calendarExtraClass);

        $x.append($calendar, document.body);

        this.opened = false;
      },

      /** populates the calendar starting with the date passed in
       * @param {X date} date Date representing the start date of the calendar
       */
      populate: function(offset){
        this.fixDates();

        if(offset && this.calendarDate){
          this.calendarDate.shift(0, offset);
        }
        else{
          this.calendarDate = this.calculateCalendarDate();
        }

        var currentCalendarDate = this.calendarDate.clone();

        var $monthLabels = $x.get('.-x-month-bar .-x-label', $calendar);
        var today = $x.date();
        var todayDateStr = today.format('Ymd');
        var minDateStr = this.config.minDate ? (this.mode==='start' ? this.config.minDate.format('Ymd') : this.config.minDate.clone().shift(this.config.minDiff).format('Ymd')) : null;
        var maxDateStr = this.config.maxDate ? (this.mode==='end' ? this.config.maxDate.format('Ymd') : this.config.maxDate.clone().shift(-this.config.minDiff).format('Ymd')) : null;

        var startDateStr = this.startDate ? this.startDate.format('Ymd') : null;
        var endDateStr = this.endDate ? this.endDate.format('Ymd') : null;

        for(var monthCount=1; monthCount<=maxMonths; monthCount++){
          var $month = $x.get('li.-x-month', $calendar)[monthCount-1];

          if(monthCount>this.config.length){
            $x.addClass($month, '-x-hidden');
            continue;
          }
          else{
            $x.removeClass($month, '-x-hidden');
          }

          var $monthLabel = $monthLabels[monthCount-1];
          var $cells = $x.get('li.-x-day', $month);

          var daysInMonth = currentCalendarDate.daysInMonth();
          var monthStartDay = currentCalendarDate.clone().day(1).dayOfWeek();
          var thisMonthStr = currentCalendarDate.format('Ym');
          var thisDay = 1;

          var hasFourRows = monthStartDay===1 && daysInMonth===28;

          $x.attr($month, 'data', {
            'month': currentCalendarDate.month(),
            'year': currentCalendarDate.year()
          });

          $x.removeClass($month, '-x-clear');
          if((monthCount-1) % this.config.monthsPerRow===0){
            $x.addClass($month, '-x-clear');
          }

          $x.text($monthLabel, monthLabels[currentCalendarDate.month()] + ' ' + currentCalendarDate.year());

          for(var cell=1; cell<=42; cell++){
            var $cell = $cells[cell-1];
            var thisDateStr = null;
            var isOutOfRange = false;
            var isDayCell = thisDay<=daysInMonth && (hasFourRows && cell>=8 || cell>=monthStartDay);

            $x.removeClass($cell, '-x-start -x-end -x-today -x-selectable -x-highlighted -x-out-of-range -x-blank');

            if(isDayCell){
              thisDateStr = thisMonthStr+$x.pad(thisDay, 0, 2);
              isOutOfRange = minDateStr && thisDateStr<minDateStr || maxDateStr && thisDateStr>maxDateStr;

              $x.text($cell, thisDay);
              $x.attr($cell, 'data-day', thisDay);

              thisDay++;

              if(thisDateStr===todayDateStr){ //is today's date
                $x.addClass($cell, '-x-today');
              }
              if(startDateStr===thisDateStr){ //is start date
                $x.addClass($cell, '-x-start');
              }
              if(endDateStr===thisDateStr){ //is end date
                $x.addClass($cell, '-x-end');
              }

              $x.addClass($cell, !isDayCell || isOutOfRange ? '-x-out-of-range' : '-x-selectable');
            }
            else{
              $x.addClass($cell, '-x-blank -x-out-of-range');
              $x.removeAttr($cell, 'data-day');
              $x.text($cell, '');
            }
          }

          currentCalendarDate.shift(0, 1);
        }

        this.updateSelection();
      },

      /** determines the date of the first month that should be visible on the calendar
       * @param {X date} [date] Subject date
       * @param {String} [mode] (start|end) Calendar mode
       * @returns {X date} The determined date
       */
      calculateCalendarDate: function(){
        var startDate = this.getStartDate() || $x.date();
        if(this.mode==='start'){
          return startDate;
        }
        else{
          var thisEndDate = this.getEndDate();

          if(thisEndDate){
            var diff = thisEndDate.monthDiff(startDate);
            if(diff>this.config.length){
              return startDate.clone().shift(0, diff-this.config.length+1);
            }
          }

          return startDate;
        }
      },

      getStartDate: function(){
        return this.startDate ? this.startDate.clone() : null;
      },

      getEndDate: function(){
        return this.endDate ? this.endDate.clone() : null;
      },

      /** gets date from one of the date input fields
       * @param {String} [type] (start|end) Input type
       * @returns {X date} Date from the input
       */
      getInputDate: function(type){
        if(!type){ type = this.mode; }
        var $input = this.config['$'+type+'Date'];
        if($input){
          var value = $input.value;
          if(value.length){
            var date = $x.date(value);
            if(date.isValid()){
              return date;
            }
          }
        }
        return null;
      },

      /** sets date on the input element determined by type
       * @param {X date} date Date to be set
       * @param {String} [type] (start|end) Input type
       */
      setInputDate: function(date, type){
        if(!type){ type = this.mode; }
        var $input = this.config['$'+type+'Date'];

        $input.value = !date ? '' : date.format(this.config.outFormat);
        this[type+'Date'] = date || null;
      },

      mark: function(date, type){
        if(this.config.selectionType==='week'){
          date = this.snapToWeek(date, type);
        }
        this.setInputDate(date, type);
        this.fixDates();
      },

      snapToWeek: function(date, type){
        if(!date || !date.isValid()){ return date; }

        var dow = date.dayOfWeek();

        if(type==='start'){
          date.shift(-dow+1);
        }
        else{
          date.shift(7-dow);
        }

        return date;
      },

      /** makes a selection on the calendar
       * () - (re)sets persistent selection based on input values
       * (startDate, endDate) - sets persistent sleection based on specified dates
       */
      updateSelection: function(startDate, endDate){
        if(this.config.selectionType==='week'){
          startDate = this.snapToWeek(startDate, 'start');
          endDate = this.snapToWeek(endDate, 'end');
        }

        //remove old selection first
        $x.removeClass($x.get('li.-x-day', $calendar), '-x-selection -x-start -x-end');

        var $allSelectable = $x.get('li.-x-day.-x-selectable', $calendar);

        var $firstSelectable = $allSelectable[0];
        var $lastSelectable = $allSelectable[$allSelectable.length-1];

        if(!$firstSelectable){ return; }

        //first and last selectable date on the current calendar
        var firstSelectableDate = this.getDateByCell($firstSelectable);
        var lastSelectableDate = this.getDateByCell($lastSelectable);

        //marker dates and cells
        var startMarkerDate = startDate || this.getStartDate();
        var endMarkerDate = endDate || this.getEndDate();

        //take minDiff/maxDiff into account
        if(startMarkerDate && endMarkerDate){
          var diff = startMarkerDate.dayDiff(endMarkerDate, true);
          if(this.mode==='start'){
            if(diff<this.config.minDiff || this.config.maxDiff && diff>this.config.maxDiff){
              endMarkerDate = null;
            }
          }
          else if(this.mode==='end'){
            if(diff<this.config.minDiff || this.config.maxDiff && diff>this.config.maxDiff){
              startMarkerDate = null;
            }
          }
        }

        var $startMarkerCell = this.getCellByDate(startMarkerDate);
        var $endMarkerCell = this.getCellByDate(endMarkerDate);

        //range dates, i.e. marker dates or first or last available selectable dates
        var rangeStartDate;
        var rangeEndDate;

        var noSelection = false;

        //add markers
        if((this.mode==='start' || !endMarkerDate || endMarkerDate.greaterEqual(startMarkerDate))){
          if($startMarkerCell){
            $x.addClass($startMarkerCell, '-x-start');
          }
          rangeStartDate = startMarkerDate;
        }
        else{
          rangeStartDate = firstSelectableDate;
          noSelection = true;
        }

        if((this.mode==='end' || !startMarkerDate || startMarkerDate.lowerEqual(endMarkerDate))){
          if($endMarkerCell){
            $x.addClass($endMarkerCell, '-x-end');
          }
          rangeEndDate = endMarkerDate;
        }
        else{
          rangeEndDate = lastSelectableDate;
          noSelection = true;
        }

        this.updateCounter(startMarkerDate, endMarkerDate);

        if(noSelection){ return; }


        if(rangeStartDate && rangeEndDate){
          //add selection class to every first day of month within the selection - this is to aid the css selectors
          var iteratorDate = rangeStartDate.clone(); //note: we're not setting day(1) here. Otherwise the first month wouldn't be highlighted under certain circumstances

          while(1){
            var $day1stOfMonth = this.getCellByDate(iteratorDate);

            if(iteratorDate.greater(rangeEndDate)){
              break;
            }
            if($day1stOfMonth && iteratorDate.greaterEqual(rangeStartDate)){
              $x.addClass($day1stOfMonth, '-x-selection');
            }

            iteratorDate.day(1).shift(0, 1);

          }
        }
      },

      updateCounter: function(startDate, endDate){
        var val;
        if(startDate && endDate){
          var diff = endDate.dayDiff(startDate);
          if(diff<0){ val = 'N/A'; }
          else if(this.config.selectionType==='week'){
            val = Math.ceil(diff/7);
          }
          else{
            val = diff;
          }
        }
        else{
          val = 'N/A';
        }

        $x.text($counterValue, val);
      },

      /** gets a day cell element by date
       * @param {X date} date Subject date
       * @returns {HTMLElement} Day cell element matching the date
       */
      getCellByDate: function(date){
        if(!date){ return null; }
        return $x.get1('.-x-month[data-year='+date.year()+'][data-month='+date.month()+'] .-x-day[data-day='+date.day()+']', $calendar) || null;
      },

      /** gets a date from a day cell element
       * @param {HTMLElement} $cell Subject day cell element
       * @returns {X date} Date from the day cell
       */
      getDateByCell: function($cell){
        var $month = $x.closest($cell, '.-x-month');
        var dateObj = {
          d: $x.attr($cell, 'data-day'),
          m: $x.attr($month, 'data-month'),
          y: $x.attr($month, 'data-year')
        };
        var date = $x.date(dateObj);
        return date.isValid() ? date : null;
      },

      /** navigates within the calendar
       *
       */
      navigate: function(direction, jumpType){
        if(direction==='current'){
          this.populate();
          return;
        }

        var length = jumpType==='short' ? 1 : this.config.length;
        this.populate(direction==='left' ? -length : length);
      },

      /** checks whether the entered dates are selectable and whether start date and end date collide and fixes them
       *
       */
      fixDates: function(){
        //check if dates are valid
        if(this.startDate && (
             !this.startDate.isValid() ||
             this.config.minDate && this.startDate.lower(this.config.minDate) || //startDate < minDate
             this.config.maxDate && this.startDate.clone().shift(this.config.minDiff).greater(this.config.maxDate) || //startDate + minDiff > maxDate
             this.config.selectionType==='week' && this.startDate.dayOfWeek()!==1
           )
        ){
          this.setInputDate('', 'start');
        }
        if(this.endDate && (
             !this.endDate.isValid() ||
             this.config.minDate && this.endDate.clone().shift(-this.config.minDiff).lower(this.config.minDate) || //endDate - minDiff < minDate
             this.config.maxDate && this.endDate.greater(this.config.maxDate) ||
             this.config.selectionType==='week' && this.endDate.dayOfWeek()!==7
           )
        ){
          this.setInputDate('', 'end');
        }

        //check if dates collide
        if(this.startDate && this.endDate){
          var diff = this.startDate.dayDiff(this.endDate, true);
          if(this.mode==='start'){
            if(this.startDate.greater(this.endDate) ||
               diff<this.config.minDiff ||
               this.config.maxDiff && diff>this.config.maxDiff
            ){
              this.setInputDate('', 'end');
            }
          }
          else if(this.mode==='end'){
            if(this.endDate.lower(this.startDate) ||
               this.endDate.clone().shift(-this.config.minDiff).lower(this.startDate) || //endDate - minDiff < startDate
               diff<this.config.minDiff ||
               this.config.maxDiff && diff>this.config.maxDiff
            ){
              this.setInputDate('', 'start');
            }
          }
        }
      }
    };

    return function(config){
      return new Calendar(config);
    };
  }());
}(window.$x));
/*jslint nomen: true, plusplus: true, vars: true, white: true, browser: true */

(function($x){
  'use strict';

  $x.widget.editor = (function(){

    var Editor = function(element){
      var This = this;
      this.config = {
        indentCharacter: " ",
        indentSize: 2
      };

      this.element = $x.get1(element);
      this.helper = new Helper(this);
      this.indentStr = null;
      this.clipboardLines = [];
      this.pasted = false;

      if(this.config.indentCharacter==="\t"){
        $x.style(this.element, {
          'tabSize': this.config.indentSize,
          'WebkitTabSize': this.config.indentSize,
          'MozTabSize': this.config.indentSize
        });

        this.indentStr = this.config.indentCharacter;
      }
      else{
        this.indentStr = $x.repeat(this.config.indentCharacter, this.config.indentSize);
      }

      $x.addEvent(this.element, 'keydown', function(e){
        var keys = $x.keysPressed(e, true);

        if(keys==='CTRL+C'){ //copy current line
          This.addLineToClipboard();
        }
        else if(keys==='CTRL+X'){ //cut current line (when there's no selection)
          This.addLineToClipboard(true);
        }
        else if(keys==='CTRL+V'){ //handle paste - prevent default behavior if there was anything in the cut stack
          if(This.pasteClipboardLines()){ $x.preventDefault(e); }
        }
        else if(keys==='TAB'){ //indent
          $x.preventDefault(e);
          This.indent();
        }
        else if(keys==='SHIFT+TAB'){ //dedent
          $x.preventDefault(e);
          This.dedent();
        }
        else if(keys==='ENTER'){ //preserve indentation, auto indent if auto-indentation is enabled, auto-insert bullet point character if previous line had one
          $x.preventDefault(e);
          This.goToNewLine();
        }
        else if(keys==='CTRL+HOME'){ //jump to beginning of text
          $x.preventDefault(e);
          This.jumpToBeginningOfText();
        }
        else if(keys==='CTRL+END'){ //jump to end of text
          $x.preventDefault(e);
          This.jumpToEndOfText();
        }
        else if(keys==='HOME'){ //jump to either the beginning of the line or beginning of text (toggle)
          $x.preventDefault(e);
          This.jumpToBeginningOfLine();
        }
        else if(keys==='END'){ //normally it wouldn't be needed but this is to normalize the behavior on mac
          $x.preventDefault(e);
          This.jumpToEndOfLine();
        }
        else if(keys==='BACKSPACE'){ //
          if(This.deleteBeforeCursor()){ $x.preventDefault(e); }
        }
      });

      $x.addEvent(this.element, 'copy', function(e){
        This.clearClipboardLines();
      });
      $x.addEvent(this.element, 'paste', function(e){
        if(This.clipboardLines.length){ $x.preventDefault(e); }
      });
    };

    Editor.prototype = {
      deleteBeforeCursor: function(){
        var linePos = this.helper.getLinePosition();
        var caretPos = this.helper.getCaretPosition();
        var caretPosWithinLine = caretPos - linePos.start;

        if(caretPosWithinLine>0){
          return this.dedentLine();
        }
        return false;
      },

      indent: function(){
        var selection = this.helper.expandMultilineSelectionRange();

        if(!selection.multiline){
          this.helper.insertText(this.indentStr);
        }
        else{ //multiline selection
          //indent each line within selection with indentation character
          var lines = this.helper.getText(selection).split("\n");
          for(var a=0,length=lines.length;a<length;a++){
            lines[a] = this.indentStr + lines[a];
          }

          this.helper.insertText(lines.join("\n"), selection, true);
        }
      },

      dedent: function(){
        var selection = this.helper.expandMultilineSelectionRange();

        if(!selection.multiline){
          this.dedentLine();
        }
        else{ //multiline selection
          //indent each line within selection with indentation character
          var lines = this.helper.getText(selection).split("\n");
          var regex;
          for(var a=0,length=lines.length;a<length;a++){
            regex = new RegExp('^'+this.indentStr);
            lines[a] = lines[a].replace(regex, '');
          }

          this.helper.insertText(lines.join("\n"), selection, true);
        }
      },

      dedentLine: function(){
        //check if there's only whitespace before cursor on this line or if we're at the beginning of line
        var linePos = this.helper.getLinePosition();
        var text = this.element.value;
        var lineText = text.substring(linePos.start, linePos.end+1);
        var caretPos = this.helper.getCaretPosition();
        var caretPosWithinLine = caretPos - linePos.start;
        var match = lineText.match(/[^\s]/);
        var firstNonWhiteSpaceCharacterPos = match && match.index ? match.index : 0;
        var newCaretPos;

        if(caretPosWithinLine<=firstNonWhiteSpaceCharacterPos || !match){ //caret is within initial whitespace
          if(match && this.indentStr.length > firstNonWhiteSpaceCharacterPos){ //remove all whitespace
            lineText = lineText.substring(firstNonWhiteSpaceCharacterPos); //!!!should I use insertText for this?
            this.element.value = text.substring(0, linePos.start) + lineText + text.substring(linePos.end+1);
            newCaretPos = linePos.start;
          }
          else{ //remove exactly one indentStr
            lineText = lineText.substring(this.indentStr.length); //!!!should I use insertText for this?
            this.element.value = text.substring(0, linePos.start) + lineText + text.substring(linePos.end+1);
            newCaretPos = caretPos - this.indentStr.length;
          }

          //update line
          this.helper.setCaretPosition(Math.max(newCaretPos, linePos.start));

          return true;
        }
        return false;
      },

      addLineToClipboard: function(cut){
        if(this.pasted){ this.clearClipboardLines(); }
        var linePos = this.helper.getLinePosition();
        var text = this.element.value;
        var lineText = text.substring(linePos.start, linePos.end+1);
        this.clipboardLines.push(lineText);

        if(cut){
          var endPos = (text.charAt(linePos.end+1)==="\n") ? linePos.end + 1 : linePos.end;
          var caretPos = this.helper.getCaretPosition();
          this.element.value = text.substring(0, linePos.start) + text.substring(endPos+1);
          this.helper.setCaretPosition(linePos.start); //set caret where it was or at the beginning of line
        }
      },

      pasteClipboardLines: function(){
        if(this.clipboardLines.length){
          var lineStartPos = this.helper.getLineStartPosition();
          var text = this.element.value;
          var before = text.substring(0, lineStartPos);
          var cutLinesStr = this.clipboardLines.join("\n") + "\n";
          var after = text.substring(lineStartPos);
          this.element.value = before + cutLinesStr + after;
          this.helper.setCaretPosition((before+cutLinesStr).length);
          this.pasted = true;
          return true;
        }
        return false;
      },

      clearClipboardLines: function(){
        this.clipboardLines = [];
        this.pasted = false;
      },

      goToNewLine: function(){
        var linePos = this.helper.getLinePosition();
        var text = this.element.value;
        var caretPosWithinLine = this.helper.getCaretPosition() - linePos.start;
        var currentLineText = text.substring(linePos.start, linePos.end+1);
        var currentLineInitialWhiteSpace = currentLineText.match(/^\s*/);
        this.helper.insertText("\n" + currentLineInitialWhiteSpace);
      },

      jumpToBeginningOfLine: function(){
        var linePos = this.helper.getLinePosition();
        var lineText = this.element.value.substring(linePos.start, linePos.end+1);
        var caretPos = this.helper.getCaretPosition();
        var caretPosWithinLine = caretPos - linePos.start;
        var match = lineText.match(/^[\s]*([^\s])/);
        var endOfInitialWhitespacePos = match && match[0].length-1 || 0;
        if(caretPosWithinLine===endOfInitialWhitespacePos){ //jump to beginning of line
          this.helper.setCaretPosition(linePos.start);
        }
        else{ //jump to end of initial whitespace
          this.helper.setCaretPosition(linePos.start + endOfInitialWhitespacePos);
        }
      },

      jumpToEndOfLine: function(){
        var linePos = this.helper.getLinePosition();
        this.helper.setCaretPosition(linePos.end+1);
      },

      jumpToBeginningOfText: function(){
        this.helper.setCaretPosition(0);
      },

      jumpToEndOfText: function(){
        this.helper.setCaretPosition(this.element.value.length);
      }
    };


    var Helper = function(editor){
      this.editor = editor;
    };

    Helper.prototype = {
      getCaretPosition: function(){
        return this.getSelectionRange().start;
      },

      setCaretPosition: function(position){
        this.editor.element.setSelectionRange(position, position);
      },

      getText: function(position){
        if(!$x.type(position)){ position = this.getSelectionRange(); }
        return this.editor.element.value.substring(position.start, position.end);
      },

      insertText: function(text, position, reselect){
        if(!$x.type(position)){ position = this.getSelectionRange(); }

        var scrollPosition = this.editor.element.scrollTop;

        //if(pos.start!==pos.end){ setSelectionRange(pos.start, pos.end); }

        var event = document.createEvent('TextEvent');
        if(event.initTextEvent){
          event.initTextEvent('textInput', true, true, null, text);
          this.editor.element.dispatchEvent(event);
        }
        else{
          /** The initTextEvent is not yet supported in firefox, unfortunately.
           * The solution below works fine but undoing it with CTRL-Z will result
           * in the whole text getting selected since the selection is not
           * stored on the undo stack
           */
          var textAreaValue = this.editor.element.value;
          var before = textAreaValue.substring(0, position.start);
          var after = textAreaValue.substring(position.end);
          this.editor.element.value = before + text + after;
        }

        if(reselect){
          this.setSelectionRange(position.start, position.start + text.length); //update selection to include the selected text
        }
        else{
          this.setCaretPosition(position.start + text.length); //dont make selection, just set caret position at the end of the replaced text
        }

        this.editor.element.scrollTop = scrollPosition;
      },

      /** returns selection range; in case of no selection, both start and end position is equal to caret position
       */
      getSelectionRange: function(){
        return {
          start: this.editor.element.selectionStart,
          end: this.editor.element.selectionEnd
        };
      },

      setSelectionRange: function(start, end){
        this.editor.element.selectionStart = start;
        this.editor.element.selectionEnd = end+1;
      },

      /** expands selection to cover full lines if the current selection spans multiple lines
       */
      expandMultilineSelectionRange: function(){
        var pos = this.getSelectionRange();
        if(pos.start===pos.end){
          pos.multiline = false;
          return pos;
        } //nothing to do as there's currently no selection

        var startPos = this.getLineStartPosition(pos.start);
        var endPos = this.getLineEndPosition(pos.end);
        if(endPos===this.getLineEndPosition(pos.start)){ //do nothing when the selection is not spanning multiple lines
          pos.multiline = false;
          return pos;
        }
        this.setSelectionRange(startPos, endPos);

        return {
          start: startPos,
          end: endPos,
          multiline: true
        };
      },

      /** returns position of the beginning of line containing the specified position
       */
      getLineStartPosition: function(position){
        if(!$x.type(position, 'number')){ position = this.getCaretPosition(); }

        var val = this.editor.element.value;
        var prevNL = val.lastIndexOf("\n", position-1); //position of preceding new-line
        if(prevNL===-1){ return 0; }
        return prevNL+1;
      },

      /** returns position of the end of line at which the specified position is
       */
      getLineEndPosition: function(position){
        if(!$x.type(position, 'number')){ position = this.getCaretPosition(); }

        var val = this.editor.element.value;
        var nextNL = val.indexOf("\n", position); //position of succeding new-line
        if(nextNL===-1){ return val.length - 1; }
        return nextNL-1;
      },

      getLinePosition: function(position){
        return {
          start: this.getLineStartPosition(position),
          end: this.getLineEndPosition(position)
        };
      }
    };

    return function(element){
      if(element instanceof Editor){ return element; }
      else{ return new Editor(element); }
    };
  }());
}(window.$x));
