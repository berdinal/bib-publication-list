var bibtexify = (function($) {
    var htmlify = function(str) {
        str = str.replace(/\\"\{a\}/g, '&auml;');
        str = str.replace(/\{\\aa\}/g, '&aring;');
        str = str.replace(/\\aa\{\}/g, '&aring;');
        str = str.replace(/\\"a/g, '&auml;');
        str = str.replace(/\\"\{o\}/g, '&ouml;');
        str = str.replace(/\\'e/g, '&eacute;');
        str = str.replace(/\\'\{e\}/g, '&eacute;');
        str = str.replace(/\\'a/g, '&aacute;');
        str = str.replace(/\\'A/g, '&Aacute;');
        str = str.replace(/\\"o/g, '&ouml;');
        str = str.replace(/\\ss\{\}/g, '&szlig;');
        str = str.replace(/\{/g, '');
        str = str.replace(/\}/g, '');
        str = str.replace(/\\&/g, '&amp;');
        str = str.replace(/--/g, '&ndash;');
        return str;
    };

    var options;
    var $pubTable;

    var bib2html = {
        inproceedings: function(entryData) {
            return authors2html(entryData.author) + " (" + entryData.year + "). " + 
                entryData.title + ". In <em>" + entryData.booktitle + 
                ", pp. " + entryData.pages + 
                ((entryData.address)?", " + entryData.address:"") + ".<\/em>";
        },
        article: function(entryData) {
            return authors2html(entryData.author) + " (" + entryData.year + "). " + 
                entryData.title + ". <em>" + entryData.journal + ", " + entryData.volume +
                ((entryData.number)?"(" + entryData.number + ")":"")+ ", " + 
                entryData.pages + ". " + 
                ((entryData.address)?entryData.address + ".":"") + "<\/em>";
        },
        misc: function(entryData) {
            return authors2html(entryData.author) + " (" + entryData.year + "). " + 
                entryData.title + ". " + 
                ((entryData.howpublished)?entryData.howpublished + ". ":"") + 
                ((entryData.note)?entryData.note + ".":"");
        },
        mastersthesis: function(entryData) {
            return authors2html(entryData.author) + " (" + entryData.year + "). " + 
            entryData.title + ". " + entryData.type + ". " +
            entryData.organization + ", " + entryData.school + ".";
        },
        techreport: function(entryData) {
            return authors2html(entryData.author) + " (" + entryData.year + "): " + 
                entryData.title + ". " + entryData.institution + ". " +
                entryData.number + ". " + entryData.type + ".";
        },
        importance: {
            'TITLE': 9999,
            'article': 40,
            'book': 50,
            'conference': 33,
            'inbook': 45,
            'incollection': 30,
            'inproceedings': 29,
            'manual': 5,
            'mastersthesis': 10,
            'misc': 0,
            'phdthesis': 43,
            'proceedings': 31,
            'techreport': 8,
            'unpublished': 2 },
        labels: {
            'article': 'Journal articles',
            'book': 'Books',
            'conference': '',
            'inbook': 'Book chapters',
            'incollection': '',
            'inproceedings': 'Conference articles',
            'manual': 'Manuals',
            'mastersthesis': 'Thesis',
            'misc': 'Misc',
            'phdthesis': 'PhD Thesis',
            'proceedings': 'Conference proceedings',
            'techreport': 'Technical reports',
            'unpublished': 'Unpublished papers'}
    };
    bib2html.phdthesis = bib2html.mastersthesis;
    var stats = { };
    var years = [], types = [];
    function entries2table(bibentries) {
        var htmlStr = '<thead><tr><th>Title</th><th>Year</th><th>Type</th></thead><tbody>';
        bibentries.sort(function(a, b) { return b.year - a.year; });
        var prevYear = null, item, count = 0, header;
        for (var index in bibentries) {
            item = bibentries[index];
            types[item.type] = item.type;
            header = item.year;
            if (index === '0' || (prevYear && header != prevYear)) {
                years[item.year] = true;
                htmlStr += '<tr class="yearHeader year' + header + '"><td>' + header + 
                    '<\/td><td class="hiddenCol">' + header + 
                    '<\/td><td class="hiddenCol">' + bib2html.importance.TITLE +
                    '<\/td><\/tr>';
            }
            prevYear = header;
            htmlStr += '<tr class="bibitem type' + item.type + ' year' + 
                item.year + ((count%2===0)?'':' odd') + '"><td>' + 
                item.html + '<\/td><td class="hiddenCol">' +
                item.year + '<\/td><td class="hiddenCol">' + 
                bib2html.importance[item.type] + '<\/td><\/tr>';
            count++;
        }
        for (var type in types) {
            htmlStr += '<tr class="typeHeader hiddenheader type' + type + '"><td>' + bib2html.labels[type] + 
                '<\/td><td class="hiddenCol">2100<\/td><td class="hiddenCol">' + 
                bib2html.importance[type] + '<\/td><\/tr>';
        }
        htmlStr += "<\/tbody>";
        createFilters();
        return htmlStr;
    }
    function addProtovis() {
        var yearstats = [], max = 0;
        for (item in stats) {
            max = Math.max(max, stats[item].count);
            yearstats.push({'year': item, 'count': stats[item].count, 
                'item': stats[item], 'types': stats[item].types});
        }
        yearstats.sort(function(a, b) {
            return a.year - b.year; 
        });
        var stats2html = function(item) {
            var str = '<h3>' + item.year + ' (total ' + item.count + ')<\/h3>';
            str += '<ul>';
            $.each(item.types, function(type, value) {
                str += '<li>' + bib2html.labels[type] + ' ' + value + '<\/li>';
            });
            return str + '<\/ul>';
        };
        var w = 550, h = 100,
            x = pv.Scale.ordinal(pv.range(yearstats.length)).splitBanded(0, w, 4.8/5),
            y = pv.Scale.linear(0, 6).range(0, h);
        var vis = new pv.Panel().width(w).height(h).bottom(20).
            left(20).right(5).top(5);

        vis.canvas("pubchart");
        var bar = vis.add(pv.Bar).data(yearstats).
            left(function() { return x(this.index); } ).
            width(x.range().band).bottom(0).fillStyle("#eee").
            event("mouseover", function(d) { $("#pubyeardetails").html(stats2html(d)).show();}).
            height(function(d) { return d.count*h/6; });

        bar.anchor("bottom").add(pv.Label).textStyle("black").
            text(function(d) { return d.count.toFixed(0);});

        bar.anchor("bottom").add(pv.Label).textMargin(5).
            textBaseline("top").text(function(d) { return d.year;});

        vis.add(pv.Rule).data(y.ticks()).
            bottom(function(d) {return Math.round(y(d)) - 0.5;}).
            strokeStyle(function(d) {return d ? "rgba(255,255,255,.4)" : "#000";});

        vis.render();				
    }
    function bibdownloaded(data) {
        bibtex = new BibTex();
        bibtex.content = data;
        bibtex.parse();
        var bibentries = [];
        for (var index = 0; index < bibtex.data.length; index++) {
            var item = bibtex.data[index];
            bibentries.push({
                'year': item.year,
                'type': item.entryType,
                'html': entry2html(item)
            });
            updateStats(item);
        }
        $pubTable.append(entries2table(bibentries)).tablesorter();
        if (options.protovis) {
            addProtovis();
        }

    }
    function createFilters() {
        var filterInput, parentElem = $("#yearFilters").html('').change(function(event) {
            event.stopPropagation();
            $("." + $(event.target).attr('id'), $pubTable).toggleClass('yearhidden');
        });
        var elemCreator = function(elemId) {
            return $("<input/>").
            attr({'type': 'checkbox', 
                'checked': 'true',
                'id': elemId });
        };
        var labelCreator = function(elemId, label) {
            return $("<label/>").attr({'for': elemId}).html(label);
        };
        for (var item in years) {
            parentElem.append(elemCreator('year' + item)).
                    append(labelCreator('year' + item, 
                            item));
        }
        parentElem = $("#typeFilters").html('').change(function(event) {
            event.stopPropagation();
            $("." + $(event.target).attr('id'), $pubTable).toggleClass('typehidden');
        });
        for (var item in types) {
            parentElem.append(elemCreator('type' + item)).
                    append(labelCreator('type' + item, 
                            bib2html.labels[item].split(' ')[0]));
        }
    }
    function entry2html(entryData) {
        var itemStr = htmlify(bib2html[entryData.entryType.toLowerCase()](entryData));
        if (entryData.url) {
            itemStr += ' (<a title="This article online" href="' + entryData.url +
            '">link<\/a>)';
        } 
        itemStr += '<\/li>';
        return itemStr.replace(/undefined/g, '<span class="undefined">undefined<\/span>');
    }
    function authors2html(authorData) {
        var authorsStr = '';
        for (var index = 0; index < authorData.length; index++) {
            if (index > 0) { authorsStr += ", "; }
            authorsStr += authorData[index].last;
        }
        return htmlify(authorsStr);
    }
    function updateStats(item) {
        if (!stats[item.year]) {
            stats[item.year] = { 'count': 1, 'types': {} };
            stats[item.year].types[item.entryType] = 1;
        } else {
            stats[item.year].count += 1;
            if (stats[item.year].types[item.entryType]) {
                stats[item.year].types[item.entryType] += 1;
            } else {
                stats[item.year].types[item.entryType] = 1;
            }
        }
    };
    return function(bibfile, bibElemId, opt) {
        options = $.extend({}, {'protovis': true}, opt);
        var yearBit = 1, typeBit = 0;
        $pubTable = $("#" + bibElemId);
        $pubTable.before((options.protovis?'<div style="float:left;" id="pubchart"></div>':'') + 
                '<div id="pubyeardetails"></div>' +
                '<div class="clear"></div>' +
                '<div><strong>Sort by</strong>' + 
                '<input type="radio" checked="true" name="sort" id="sortByYear"><label for="sortByYear">year</label>' +
                '<input type="radio" name="sort" id="sortByType"><label for="sortByType">type</label>' +
                '</div><div><strong>Show years</strong> <span id="yearFilters"></span>' + 
        '<strong>&nbsp;&nbsp;Show types</strong> <span id="typeFilters"></span></div>');
        $.get(bibfile, bibdownloaded);
        $("#sortByType").click(function(event) {
            typeBit = typeBit?0:1;
            var sorting = [[2,typeBit], [1,1]];
            $(".typeHeader", $pubTable).removeClass("hiddenheader");
            $(".yearHeader", $pubTable).addClass("hiddenheader");
            $pubTable.trigger("sorton",[sorting]);
            yearBit = 0;
        });
        $("#sortByYear").click(function(event) {
            yearBit = yearBit?0:1;
            var sorting = [[1,yearBit], [2,1]]; 
            $(".typeHeader", $pubTable).addClass("hiddenheader");
            $(".yearHeader", $pubTable).removeClass("hiddenheader");
            typeBit = 0;
            $pubTable.trigger("sorton",[sorting]); 
        });
    };

})(jQuery);